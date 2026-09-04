"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";

export async function startOrGetPersonConversation(otherId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (auth.ctx.userId === otherId) return fail("You cannot message yourself.");
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
