"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limitAction, notify, trackEvent } from "@/lib/actions/notify";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { canMessageApplicant, canStartDirectConversation, isUuid } from "@/lib/domain/messaging-rules";

async function requireMember(supabase: SupabaseClient, userId: string, conversationId: string) {
  if (!isUuid(conversationId)) return false;
  const member = await supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", userId)
    .maybeSingle();
  return Boolean(member.data);
}

async function createLinkedPeerConversation(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
  fields: { kind: string; job_id?: string; gig_id?: string; title: string },
): Promise<ActionResult> {
  const conversationId = crypto.randomUUID();
  const created = await supabase.from("conversations").insert({
    id: conversationId,
    ...fields,
  });
  if (created.error) return fail("Could not open that conversation.");
  const selfMember = await supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: userId,
  });
  if (selfMember.error) return fail("Could not open that conversation.");
  const peerMember = await supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: otherId,
  });
  if (peerMember.error) return fail("Could not open that conversation.");
  revalidatePath("/messages");
  return { ok: true, id: conversationId };
}

async function findOrgConversation(supabase: SupabaseClient, organisationId: string) {
  const existing = await supabase
    .from("conversations")
    .select("id")
    .eq("organisation_id", organisationId)
    .limit(1)
    .maybeSingle();
  return existing.data?.id ?? null;
}

async function findLinkedPeerConversation(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
  column: "job_id" | "gig_id",
  entityId: string,
) {
  const mine = await supabase.from("conversation_members").select("conversation_id").eq("profile_id", userId);
  if (mine.error || !mine.data?.length) return null;
  const ids = mine.data.map((row) => row.conversation_id);
  const peer = await supabase
    .from("conversation_members")
    .select(`conversation_id, conversations(${column})`)
    .eq("profile_id", otherId)
    .in("conversation_id", ids);
  const match = (peer.data ?? []).find((row) => {
    const conversation = row.conversations as unknown as Record<string, string | null> | null;
    return conversation?.[column] === entityId;
  });
  return match?.conversation_id ?? null;
}

export async function startOrGetPersonConversation(otherId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!canStartDirectConversation(auth.ctx.userId, otherId)) {
    return fail(auth.ctx.userId === otherId ? "You cannot message yourself." : "That person is no longer available.");
  }
  const started = await auth.supabase.rpc("start_direct_conversation", { other_id: otherId });
  if (!started.error && typeof started.data === "string") {
    revalidatePath("/messages");
    return { ok: true, id: started.data };
  }
  const blocked = await auth.supabase
    .from("profile_blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${auth.ctx.userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${auth.ctx.userId})`,
    )
    .maybeSingle();
  if (blocked.data) return fail("Messaging is not available with this person.");
  const mine = await auth.supabase.from("conversation_members").select("conversation_id").eq("profile_id", auth.ctx.userId);
  if (mine.error) return fail(mine.error.message);
  const ids = (mine.data ?? []).map((row) => row.conversation_id);
  if (ids.length > 0) {
    const peer = await auth.supabase
      .from("conversation_members")
      .select("conversation_id, conversations(kind)")
      .eq("profile_id", otherId)
      .in("conversation_id", ids);
    const existing = (peer.data ?? []).find((row) => {
      const conversation = row.conversations as unknown as { kind?: string } | null;
      return conversation?.kind === "person";
    });
    if (existing) return { ok: true, id: existing.conversation_id };
  }
  const other = await auth.supabase.from("public_profiles").select("full_name").eq("id", otherId).maybeSingle();
  if (!other.data) return fail("That person is no longer available.");
  const conversationId = crypto.randomUUID();
  const created = await auth.supabase.from("conversations").insert({
    id: conversationId,
    kind: "person",
    title: other.data.full_name ?? "Conversation",
  });
  if (created.error) return fail(created.error.message);
  const selfMember = await auth.supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: auth.ctx.userId,
  });
  if (selfMember.error) return fail(selfMember.error.message);
  const peerMember = await auth.supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: otherId,
  });
  if (peerMember.error) return fail(peerMember.error.message);
  revalidatePath("/messages");
  return { ok: true, id: conversationId };
}

export async function startOrGetOrgConversation(organisationId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!isUuid(organisationId)) return fail("That organisation is no longer available.");
  const org = await auth.supabase.from("organisations").select("id, created_by, name").eq("id", organisationId).maybeSingle();
  if (!org.data) return fail("That organisation is no longer available.");
  const existing = await findOrgConversation(auth.supabase, organisationId);
  if (existing) return { ok: true, id: existing };
  let ownerId = org.data.created_by ?? null;
  if (!ownerId) {
    const owner = await auth.supabase
      .from("organisation_members")
      .select("profile_id")
      .eq("organisation_id", organisationId)
      .eq("org_role", "owner")
      .eq("invite_status", "active")
      .maybeSingle();
    ownerId = owner.data?.profile_id ?? null;
  }
  if (ownerId === auth.ctx.userId) return fail("This is your organisation.");
  if (ownerId) {
    const conversationId = crypto.randomUUID();
    const created = await auth.supabase.from("conversations").insert({
      id: conversationId,
      kind: "organisation",
      organisation_id: organisationId,
      title: org.data.name ?? "Organisation",
    });
    if (created.error) return fail(created.error.message);
    const selfMember = await auth.supabase.from("conversation_members").insert({
      conversation_id: conversationId,
      profile_id: auth.ctx.userId,
    });
    if (selfMember.error) return fail(selfMember.error.message);
    const peerMember = await auth.supabase.from("conversation_members").insert({
      conversation_id: conversationId,
      profile_id: ownerId,
    });
    if (peerMember.error) return fail(peerMember.error.message);
    revalidatePath("/messages");
    return { ok: true, id: conversationId };
  }
  return startOwnerlessEnquiry(auth.supabase, auth.ctx.userId, organisationId, org.data.name);
}

export async function startJobConversation(jobId: string, candidateId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!isUuid(jobId) || !isUuid(candidateId)) return fail("That application is no longer available.");
  const job = await auth.supabase.from("job_posts").select("id, organisation_id, title").eq("id", jobId).maybeSingle();
  if (!job.data) return fail("That job is no longer available.");
  const staff = await auth.supabase.rpc("is_org_staff", { org_id: job.data.organisation_id });
  if (!canMessageApplicant({ userId: auth.ctx.userId, isOrgStaff: Boolean(staff.data), candidateId })) {
    return fail("Only the hiring team can message applicants from this job.");
  }
  const existing = await findLinkedPeerConversation(auth.supabase, auth.ctx.userId, candidateId, "job_id", jobId);
  if (existing) return { ok: true, id: existing };
  return createLinkedPeerConversation(auth.supabase, auth.ctx.userId, candidateId, {
    kind: "job",
    job_id: jobId,
    title: job.data.title ?? "Job",
  });
}

export async function startGigConversation(gigId: string, candidateId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!isUuid(gigId) || !isUuid(candidateId)) return fail("That application is no longer available.");
  const gig = await auth.supabase.from("gig_posts").select("id, organisation_id, title").eq("id", gigId).maybeSingle();
  if (!gig.data) return fail("That gig is no longer available.");
  const staff = await auth.supabase.rpc("is_org_staff", { org_id: gig.data.organisation_id });
  if (!canMessageApplicant({ userId: auth.ctx.userId, isOrgStaff: Boolean(staff.data), candidateId })) {
    return fail("Only the hiring team can message applicants from this gig.");
  }
  const existing = await findLinkedPeerConversation(auth.supabase, auth.ctx.userId, candidateId, "gig_id", gigId);
  if (existing) return { ok: true, id: existing };
  return createLinkedPeerConversation(auth.supabase, auth.ctx.userId, candidateId, {
    kind: "gig",
    gig_id: gigId,
    title: gig.data.title ?? "Gig",
  });
}

export async function startServiceEnquiry(organisationId: string, serviceId: string): Promise<ActionResult> {
  if (!isUuid(organisationId) || !isUuid(serviceId)) return fail("That service is no longer available.");
  const started = await startOrGetOrgConversation(organisationId);
  if (started.ok && started.id) {
    const auth = await requireUser();
    if (auth.supabase) {
      await auth.supabase
        .from("conversations")
        .update({ kind: "enquiry", organisation_id: organisationId, service_id: serviceId })
        .eq("id", started.id);
    }
  }
  return started;
}

export async function submitVendorContact(input: {
  organisationId: string;
  body: string;
  intent?: "contact" | "request";
}): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`vendor-contact:${auth.ctx.userId}`, 12, 60_000);
  if (limited) return limited;
  const body = input.body.trim();
  if (body.length < 8) return fail("Write a short note before sending.");
  if (body.length > 2000) return fail("Keep the note under 2,000 characters.");
  if (!isUuid(input.organisationId)) return fail("That organisation is no longer available.");
  const org = await auth.supabase.from("organisations").select("id, created_by, name").eq("id", input.organisationId).maybeSingle();
  if (!org.data) return fail("That organisation is no longer available.");
  let ownerId = org.data.created_by ?? null;
  if (!ownerId) {
    const owner = await auth.supabase
      .from("organisation_members")
      .select("profile_id")
      .eq("organisation_id", input.organisationId)
      .eq("org_role", "owner")
      .eq("invite_status", "active")
      .maybeSingle();
    ownerId = owner.data?.profile_id ?? null;
  }
  if (ownerId === auth.ctx.userId) return fail("This is your organisation.");
  const started = await startOrGetOrgConversation(input.organisationId);
  if (!started.ok || !started.id) return started;
  await auth.supabase
    .from("conversations")
    .update({
      kind: "enquiry",
      organisation_id: input.organisationId,
      title: org.data.name,
    })
    .eq("id", started.id);
  const prefix = input.intent === "request" ? "Vendor request: " : "Contact: ";
  const sent = await auth.supabase.from("messages").insert({
    conversation_id: started.id,
    sender_id: auth.ctx.userId,
    body: `${prefix}${body}`,
  });
  if (sent.error) return fail("Could not send that request. Try again.");
  await notify(
    auth.supabase,
    ownerId,
    "enquiry",
    input.intent === "request" ? "Vendor request" : "New contact",
    `${auth.ctx.profile?.fullName ?? "Someone"} wrote to ${org.data.name}.`,
    `/messages?c=${started.id}`,
  );
  await trackEvent(auth.supabase, "vendor_contacted", "organisation", input.organisationId);
  revalidatePath("/messages");
  revalidatePath("/admin/contacts");
  return { ok: true, id: started.id };
}

async function startOwnerlessEnquiry(
  supabase: SupabaseClient,
  userId: string,
  organisationId: string,
  name: string | null,
): Promise<ActionResult> {
  const existing = await findOrgConversation(supabase, organisationId);
  if (existing) return { ok: true, id: existing };
  const conversationId = crypto.randomUUID();
  const created = await supabase.from("conversations").insert({
    id: conversationId,
    kind: "enquiry",
    organisation_id: organisationId,
    title: name ?? "Vendor enquiry",
  });
  if (created.error) return fail("Could not start that conversation.");
  const member = await supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: userId,
  });
  if (member.error) return fail("Could not start that conversation.");
  return { ok: true, id: conversationId };
}

export async function markMessagesRead(conversationId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!(await requireMember(auth.supabase, auth.ctx.userId, conversationId))) {
    return fail("That conversation is not available.");
  }
  const { error } = await auth.supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", auth.ctx.userId)
    .is("read_at", null);
  if (error) return fail(error.message);
  revalidatePath("/messages");
  revalidatePath("/notifications");
  return { ok: true };
}
