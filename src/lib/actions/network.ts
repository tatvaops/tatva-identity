"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { notify, trackEvent, limitAction } from "@/lib/actions/notify";

export async function requestConnection(addresseeId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (auth.ctx.userId === addresseeId) return fail("You cannot connect to yourself.");
  const { error } = await auth.supabase.from("connections").insert({
    requester_id: auth.ctx.userId,
    addressee_id: addresseeId,
    status: "pending",
  });
  if (error) return fail(error.message);
  await notify(auth.supabase, addresseeId, "connection", "Connection request", "Someone asked to connect.", "/network");
  await trackEvent(auth.supabase, "connection_requested", "profile", addresseeId);
  revalidatePath("/network");
  return { ok: true };
}

export async function acceptConnection(connectionId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("addressee_id", auth.ctx.userId);
  if (error) return fail(error.message);
  const row = await auth.supabase.from("connections").select("requester_id").eq("id", connectionId).maybeSingle();
  await notify(auth.supabase, row.data?.requester_id, "connection", "Connection accepted", undefined, "/network");
  revalidatePath("/network");
  return { ok: true };
}

export async function declineConnection(connectionId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("connections")
    .update({ status: "declined" })
    .eq("id", connectionId)
    .eq("addressee_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/network");
  return { ok: true };
}

export async function toggleFollowPerson(personId: string, following: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (following) {
    const { error } = await auth.supabase
      .from("follows")
      .delete()
      .eq("follower_id", auth.ctx.userId)
      .eq("person_id", personId);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("follows").insert({
      follower_id: auth.ctx.userId,
      person_id: personId,
    });
    if (error) return fail(error.message);
    await notify(auth.supabase, personId, "follow", "New follower", undefined, "/followers");
  }
  revalidatePath("/network");
  return { ok: true };
}

export async function toggleFollowOrganisation(organisationId: string, following: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (following) {
    const { error } = await auth.supabase
      .from("follows")
      .delete()
      .eq("follower_id", auth.ctx.userId)
      .eq("organisation_id", organisationId);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("follows").insert({
      follower_id: auth.ctx.userId,
      organisation_id: organisationId,
    });
    if (error) return fail(error.message);
  }
  revalidatePath("/companies");
  return { ok: true };
}

export async function createPost(body: string, postType = "update"): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = body.trim();
  if (!trimmed) return fail("Write something before posting.");
  const { error } = await auth.supabase.from("posts").insert({
    author_profile_id: auth.ctx.userId,
    body: trimmed,
    post_type: postType,
  });
  if (error) return fail(error.message);
  revalidatePath("/feed");
  return { ok: true };
}

export async function applyToJob(jobId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`apply:${auth.ctx.userId}`, 20, 60_000);
  if (limited) return limited;
  const job = await auth.supabase.from("job_posts").select("id, title, organisation_id, closed_at").eq("id", jobId).maybeSingle();
  if (job.data?.closed_at) return fail("This job is closed.");
  const { error } = await auth.supabase.from("job_applications").insert({
    job_id: jobId,
    profile_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  const org = await auth.supabase.from("organisations").select("created_by").eq("id", job.data?.organisation_id ?? "").maybeSingle();
  await notify(auth.supabase, org.data?.created_by, "application", "New job application", job.data?.title ?? undefined, `/jobs/${jobId}/applications`);
  await trackEvent(auth.supabase, "job_applied", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function applyToGig(gigId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`apply:${auth.ctx.userId}`, 20, 60_000);
  if (limited) return limited;
  const gig = await auth.supabase.from("gig_posts").select("id, title, organisation_id, closed_at, seats").eq("id", gigId).maybeSingle();
  if (gig.data?.closed_at) return fail("This gig is closed.");
  if (gig.data?.seats === 0) return fail("No seats left on this gig.");
  const { error } = await auth.supabase.from("gig_applications").insert({
    gig_id: gigId,
    profile_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  const org = await auth.supabase.from("organisations").select("created_by").eq("id", gig.data?.organisation_id ?? "").maybeSingle();
  await notify(auth.supabase, org.data?.created_by, "application", "New gig application", gig.data?.title ?? undefined, `/gigs/${gigId}/applications`);
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = body.trim();
  if (!trimmed) return fail("Message cannot be empty.");
  const limited = await limitAction(`message:${auth.ctx.userId}`, 40, 60_000);
  if (limited) return limited;
  const { error } = await auth.supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: auth.ctx.userId,
    body: trimmed,
  });
  if (error) return fail(error.message);
  const peers = await auth.supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .neq("profile_id", auth.ctx.userId);
  for (const peer of peers.data ?? []) {
    await notify(auth.supabase, peer.profile_id, "message", "New message", trimmed.slice(0, 80), "/messages");
  }
  revalidatePath("/messages");
  return { ok: true };
}

export async function addComment(postId: string, body: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = body.trim();
  if (!trimmed) return fail("Write a comment first.");
  const { error } = await auth.supabase.from("comments").insert({
    post_id: postId,
    author_profile_id: auth.ctx.userId,
    body: trimmed,
  });
  if (error) return fail(error.message);
  const post = await auth.supabase.from("posts").select("author_profile_id").eq("id", postId).maybeSingle();
  await notify(auth.supabase, post.data?.author_profile_id, "comment", "New comment on your post", trimmed.slice(0, 80), "/feed");
  revalidatePath("/feed");
  return { ok: true };
}

export async function togglePostReaction(postId: string, reacting: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (reacting) {
    const { error } = await auth.supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", auth.ctx.userId);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("post_reactions").insert({
      post_id: postId,
      profile_id: auth.ctx.userId,
      kind: "like",
    });
    if (error) return fail(error.message);
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function removeConnection(otherId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("connections")
    .delete()
    .or(
      `and(requester_id.eq.${auth.ctx.userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${auth.ctx.userId})`,
    );
  if (error) return fail(error.message);
  revalidatePath("/network");
  return { ok: true };
}

export async function toggleBlock(personId: string, blocked: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (blocked) {
    const { error } = await auth.supabase
      .from("profile_blocks")
      .delete()
      .eq("blocker_id", auth.ctx.userId)
      .eq("blocked_id", personId);
    if (error) return fail(error.message);
  } else {
    await auth.supabase.from("connections").delete().or(
      `and(requester_id.eq.${auth.ctx.userId},addressee_id.eq.${personId}),and(requester_id.eq.${personId},addressee_id.eq.${auth.ctx.userId})`,
    );
    const { error } = await auth.supabase.from("profile_blocks").insert({
      blocker_id: auth.ctx.userId,
      blocked_id: personId,
    });
    if (error) return fail(error.message);
  }
  revalidatePath("/people");
  return { ok: true };
}

export async function toggleMute(personId: string, muted: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (muted) {
    const { error } = await auth.supabase
      .from("profile_mutes")
      .delete()
      .eq("muter_id", auth.ctx.userId)
      .eq("muted_id", personId);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("profile_mutes").insert({
      muter_id: auth.ctx.userId,
      muted_id: personId,
    });
    if (error) return fail(error.message);
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateProfileAbout(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const headline = formData.get("headline");
  const about = formData.get("about");
  const headlineText = typeof headline === "string" ? headline.trim() : "";
  const aboutText = typeof about === "string" ? about.trim() : "";
  const { error } = await auth.supabase
    .from("profiles")
    .update({ headline: headlineText || null, about: aboutText || null })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath(`/people/${auth.ctx.profile?.handle ?? ""}`);
  revalidatePath("/passport");
  return { ok: true };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return fail("Supabase is not configured.");
  const { error } = await supabase.auth.signOut();
  if (error) return fail(error.message);
  revalidatePath("/");
  return { ok: true };
}
