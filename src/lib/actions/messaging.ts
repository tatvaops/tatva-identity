"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limitAction, notify, trackEvent } from "@/lib/actions/notify";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";

export async function startOrGetPersonConversation(otherId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (auth.ctx.userId === otherId) return fail("You cannot message yourself.");
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
  const conversationId = crypto.randomUUID();
  const created = await auth.supabase.from("conversations").insert({
    id: conversationId,
    kind: "person",
    title: other.data?.full_name ?? "Conversation",
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

export async function startOrGetOrgConversation(organisationId: string, _createdBy?: string | null): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const org = await auth.supabase.from("organisations").select("id, created_by, name").eq("id", organisationId).maybeSingle();
  const ownerId = org.data?.created_by ?? _createdBy ?? null;
  if (!ownerId) return fail("This organisation has no owner to message yet.");
  if (ownerId === auth.ctx.userId) return fail("This is your organisation.");
  const started = await startOrGetPersonConversation(ownerId);
  if (started.ok && started.id) {
    await auth.supabase
      .from("conversations")
      .update({ kind: "organisation", organisation_id: organisationId, title: org.data?.name ?? "Organisation" })
      .eq("id", started.id);
  }
  return started;
}

export async function startJobConversation(jobId: string, candidateId: string): Promise<ActionResult> {
  const started = await startOrGetPersonConversation(candidateId);
  if (started.ok && started.id) {
    const auth = await requireUser();
    if (auth.supabase) {
      await auth.supabase.from("conversations").update({ kind: "job", job_id: jobId }).eq("id", started.id);
    }
  }
  return started;
}

export async function startGigConversation(gigId: string, candidateId: string): Promise<ActionResult> {
  const started = await startOrGetPersonConversation(candidateId);
  if (started.ok && started.id) {
    const auth = await requireUser();
    if (auth.supabase) {
      await auth.supabase.from("conversations").update({ kind: "gig", gig_id: gigId }).eq("id", started.id);
    }
  }
  return started;
}

export async function startServiceEnquiry(organisationId: string, serviceId: string): Promise<ActionResult> {
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
  const started = ownerId
    ? await startOrGetOrgConversation(input.organisationId, ownerId)
    : await startOwnerlessEnquiry(auth.supabase, auth.ctx.userId, input.organisationId, org.data.name);
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
    "/messages",
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
  const mine = await supabase.from("conversation_members").select("conversation_id").eq("profile_id", userId);
  const ids = (mine.data ?? []).map((row) => row.conversation_id);
  if (ids.length > 0) {
    const existing = await supabase
      .from("conversations")
      .select("id")
      .eq("organisation_id", organisationId)
      .in("id", ids)
      .limit(1)
      .maybeSingle();
    if (existing.data?.id) return { ok: true, id: existing.data.id };
  }
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
  const { error } = await auth.supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", auth.ctx.userId)
    .is("read_at", null);
  if (error) return fail(error.message);
  return { ok: true };
}
