"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";

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
  const { error } = await auth.supabase.from("job_applications").insert({
    job_id: jobId,
    profile_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function applyToGig(gigId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("gig_applications").insert({
    gig_id: gigId,
    profile_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

export async function sendMessage(conversationId: string, body: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const trimmed = body.trim();
  if (!trimmed) return fail("Message cannot be empty.");
  const { error } = await auth.supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: auth.ctx.userId,
    body: trimmed,
  });
  if (error) return fail(error.message);
  revalidatePath("/messages");
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
