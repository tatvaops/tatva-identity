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

export async function startOrGetOrgConversation(_organisationId: string, createdBy: string | null): Promise<ActionResult> {
  void _organisationId;
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!createdBy) return fail("This organisation has no owner to message yet.");
  if (createdBy === auth.ctx.userId) return fail("This is your organisation.");
  return startOrGetPersonConversation(createdBy);
}
