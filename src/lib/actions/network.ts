"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { notify, trackEvent, limitAction } from "@/lib/actions/notify";
import { canApplyToListing } from "@/lib/domain/application-lifecycle";
import { canReadConversation, isUuid } from "@/lib/domain/messaging-rules";
import type { SupabaseClient } from "@supabase/supabase-js";

async function notifyOrgStaff(
  supabase: SupabaseClient,
  organisationId: string | null | undefined,
  kind: string,
  title: string,
  body: string | undefined,
  href: string,
) {
  if (!organisationId) return;
  const members = await supabase
    .from("organisation_members")
    .select("profile_id")
    .eq("organisation_id", organisationId)
    .eq("invite_status", "active")
    .in("org_role", ["owner", "admin", "recruiter"]);
  const ids = [...new Set((members.data ?? []).map((row) => row.profile_id).filter(Boolean))];
  for (const id of ids) {
    await notify(supabase, id, kind, title, body, href);
  }
}

export async function requestConnection(addresseeId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (auth.ctx.userId === addresseeId) return fail("You cannot connect to yourself.");
  const existing = await auth.supabase
    .from("connections")
    .select("id, status, requester_id, addressee_id")
    .or(
      `and(requester_id.eq.${auth.ctx.userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${auth.ctx.userId})`,
    )
    .maybeSingle();
  if (existing.data) {
    if (existing.data.status === "accepted") return fail("You are already connected.");
    if (existing.data.status === "pending") {
      if (existing.data.addressee_id === auth.ctx.userId) {
        return fail("This person already asked to connect. Open Network to accept.");
      }
      return fail("You already sent a connection request.");
    }
    const { error } = await auth.supabase
      .from("connections")
      .update({ status: "pending", requester_id: auth.ctx.userId, addressee_id: addresseeId })
      .eq("id", existing.data.id);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("connections").insert({
      requester_id: auth.ctx.userId,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") return fail("You already sent a connection request.");
      return fail(error.message);
    }
  }
  await notify(auth.supabase, addresseeId, "connection", "Connection request", "Someone asked to connect.", "/network?tab=pending");
  await trackEvent(auth.supabase, "connection_requested", "profile", addresseeId);
  revalidatePath("/network");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  return { ok: true };
}

export async function acceptConnection(connectionId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { data, error } = await auth.supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("addressee_id", auth.ctx.userId)
    .eq("status", "pending")
    .select("requester_id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("That request is no longer pending.");
  await notify(auth.supabase, data.requester_id, "connection", "Connection accepted", undefined, "/network");
  revalidatePath("/network");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  return { ok: true };
}

export async function declineConnection(connectionId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { data, error } = await auth.supabase
    .from("connections")
    .update({ status: "declined" })
    .eq("id", connectionId)
    .eq("addressee_id", auth.ctx.userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return fail("That request is no longer pending.");
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
    await notify(auth.supabase, personId, "follow", "New follower", undefined, "/network");
    await trackEvent(auth.supabase, "follow_created", "profile", personId);
  }
  revalidatePath("/network");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
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

export async function createPost(
  body: string,
  postType = "update",
  mediaPath?: string | null,
  youtubeUrl?: string | null,
): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = body.trim();
  if (!trimmed) return fail("Write something before posting.");
  const { isPlayableVideoRef } = await import("@/lib/media/youtube");
  const video = youtubeUrl?.trim() ? youtubeUrl.trim() : null;
  if (video && !isPlayableVideoRef(video)) return fail("Use a YouTube URL or upload an MP4/WebM video.");
  const created = await auth.supabase
    .from("posts")
    .insert({
      author_profile_id: auth.ctx.userId,
      body: trimmed,
      post_type: postType,
      youtube_url: video,
    })
    .select("id")
    .single();
  const createdRow =
    created.error && video
      ? await auth.supabase
          .from("posts")
          .insert({
            author_profile_id: auth.ctx.userId,
            body: trimmed,
            post_type: postType,
          })
          .select("id")
          .single()
      : created;
  if (createdRow.error || !createdRow.data) return fail(createdRow.error?.message ?? "Could not publish that update.");
  if (mediaPath) {
    const media = await auth.supabase.from("post_media").insert({
      post_id: createdRow.data.id,
      storage_path: mediaPath,
    });
    if (media.error) return fail(media.error.message);
  }
  revalidatePath("/feed");
  return { ok: true, id: createdRow.data.id };
}

export async function applyToJob(jobId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`apply:${auth.ctx.userId}`, 20, 60_000);
  if (limited) return limited;
  const job = await auth.supabase.from("job_posts").select("id, title, organisation_id, closed_at").eq("id", jobId).maybeSingle();
  if (!job.data) return fail("This job is no longer available.");
  if (!canApplyToListing({ closedAt: job.data.closed_at, exists: true })) return fail("This job is closed.");
  const existing = await auth.supabase
    .from("job_applications")
    .select("id, status")
    .eq("job_id", jobId)
    .eq("profile_id", auth.ctx.userId)
    .maybeSingle();
  if (existing.data) {
    if (existing.data.status === "withdrawn") {
      const restored = await auth.supabase
        .from("job_applications")
        .update({ status: "submitted" })
        .eq("id", existing.data.id);
      if (restored.error) return fail(restored.error.message);
    } else {
      return fail("You have already applied to this job.");
    }
  } else {
    const { error } = await auth.supabase.from("job_applications").insert({
      job_id: jobId,
      profile_id: auth.ctx.userId,
    });
    if (error) {
      if (error.code === "23505") return fail("You have already applied to this job.");
      return fail(error.message);
    }
  }
  await notifyOrgStaff(
    auth.supabase,
    job.data?.organisation_id,
    "application",
    "New job application",
    job.data?.title ?? undefined,
    `/jobs/${jobId}/applications`,
  );
  await trackEvent(auth.supabase, "job_applied", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/applications");
  return { ok: true };
}

export async function applyToGig(gigId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`apply:${auth.ctx.userId}`, 20, 60_000);
  if (limited) return limited;
  const gig = await auth.supabase.from("gig_posts").select("id, title, organisation_id, closed_at, seats").eq("id", gigId).maybeSingle();
  if (!gig.data) return fail("This gig is no longer available.");
  if (!canApplyToListing({ closedAt: gig.data.closed_at, seats: gig.data.seats, exists: true })) {
    return fail(gig.data.closed_at ? "This gig is closed." : "No seats left on this gig.");
  }
  const existing = await auth.supabase
    .from("gig_applications")
    .select("id, status")
    .eq("gig_id", gigId)
    .eq("profile_id", auth.ctx.userId)
    .maybeSingle();
  if (existing.data) {
    if (existing.data.status === "withdrawn") {
      const restored = await auth.supabase
        .from("gig_applications")
        .update({ status: "submitted" })
        .eq("id", existing.data.id);
      if (restored.error) return fail(restored.error.message);
    } else {
      return fail("You have already applied to this gig.");
    }
  } else {
    const { error } = await auth.supabase.from("gig_applications").insert({
      gig_id: gigId,
      profile_id: auth.ctx.userId,
    });
    if (error) {
      if (error.code === "23505") return fail("You have already applied to this gig.");
      return fail(error.message);
    }
  }
  await notifyOrgStaff(
    auth.supabase,
    gig.data?.organisation_id,
    "application",
    "New gig application",
    gig.data?.title ?? undefined,
    `/gigs/${gigId}/applications`,
  );
  await trackEvent(auth.supabase, "gig_applied", "gig", gigId);
  revalidatePath(`/gigs/${gigId}`);
  revalidatePath("/applications");
  return { ok: true };
}

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!isUuid(conversationId)) return fail("That conversation is not available.");
  const trimmed = body.trim();
  if (!trimmed) return fail("Message cannot be empty.");
  if (trimmed.length > 4000) return fail("Keep messages under 4,000 characters.");
  const limited = await limitAction(`message:${auth.ctx.userId}`, 40, 60_000);
  if (limited) return limited;
  const member = await auth.supabase
    .from("conversation_members")
    .select("profile_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", auth.ctx.userId)
    .maybeSingle();
  if (!canReadConversation({ userId: auth.ctx.userId, isMember: Boolean(member.data) })) {
    return fail("That conversation is not available.");
  }
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
    await notify(auth.supabase, peer.profile_id, "message", "New message", trimmed.slice(0, 80), `/messages?c=${conversationId}`);
  }
  await trackEvent(auth.supabase, "message_sent", "conversation", conversationId);
  revalidatePath("/messages");
  revalidatePath("/notifications");
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

export async function withdrawConnection(otherId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("connections")
    .delete()
    .eq("requester_id", auth.ctx.userId)
    .eq("addressee_id", otherId)
    .eq("status", "pending");
  if (error) return fail(error.message);
  revalidatePath("/network");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  return { ok: true };
}

export async function deleteOwnPost(postId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("posts").delete().eq("id", postId).eq("author_profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/feed");
  return { ok: true };
}

export async function reportEntity(entityKind: string, entityId: string, reason: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = reason.trim().slice(0, 280);
  if (!trimmed) return fail("Choose a reason.");
  const limited = await limitAction(`report:${auth.ctx.userId}`, 10, 60_000);
  if (limited) return limited;
  const { error } = await auth.supabase.from("content_reports").insert({
    reporter_id: auth.ctx.userId,
    entity_kind: entityKind,
    entity_id: entityId,
    reason: trimmed,
    status: "open",
  });
  if (error) {
    if (error.code === "23505") return fail("You already reported this.");
    return fail(error.message);
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function reportPost(postId: string, reason: string): Promise<ActionResult> {
  return reportEntity("post", postId, reason);
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
    const post = await auth.supabase.from("posts").select("author_profile_id").eq("id", postId).maybeSingle();
    await notify(auth.supabase, post.data?.author_profile_id, "reaction", "Someone reacted to your post", undefined, "/feed");
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
