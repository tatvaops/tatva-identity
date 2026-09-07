"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { recommendationRequestSchema, recommendationSchema } from "@/lib/domain/workspace-schemas";
import { notify, limitAction } from "@/lib/actions/notify";
import { personPublicHref } from "@/lib/domain/identiti-routes";
import { normalizeHandle } from "@/lib/domain/onboarding";

export async function recordProfileViewAction(viewedProfileId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return { ok: true };
  if (auth.ctx.userId === viewedProfileId) return { ok: true };
  const limited = await limitAction(`view:${auth.ctx.userId}`, 60, 60_000);
  if (limited) return { ok: true };
  const { error } = await auth.supabase.from("profile_views").insert({
    viewed_profile_id: viewedProfileId,
    viewer_profile_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  return { ok: true };
}

export async function toggleSavedItem(entityKind: string, entityId: string, saved: boolean): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (saved) {
    const { error } = await auth.supabase
      .from("saved_items")
      .delete()
      .eq("profile_id", auth.ctx.userId)
      .eq("entity_kind", entityKind)
      .eq("entity_id", entityId);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.from("saved_items").insert({
      profile_id: auth.ctx.userId,
      entity_kind: entityKind,
      entity_id: entityId,
    });
    if (error) return fail(error.message);
  }
  revalidatePath("/saved");
  revalidatePath("/jobs");
  revalidatePath("/gigs");
  revalidatePath("/service-brands");
  revalidatePath("/product-brands");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  revalidatePath("/projects");
  return { ok: true };
}

export async function writeRecommendation(input: unknown): Promise<ActionResult> {
  const parsed = recommendationSchema.safeParse(input);
  if (!parsed.success) return fail("Write a short recommendation before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (parsed.data.toProfileId === auth.ctx.userId) return fail("You cannot recommend yourself.");
  const { error } = await auth.supabase.from("recommendations").insert({
    from_profile_id: auth.ctx.userId,
    to_profile_id: parsed.data.toProfileId,
    relationship: parsed.data.relationship || null,
    body: parsed.data.body,
  });
  if (error) return fail(error.message);
  const person = await auth.supabase
    .from("public_profiles")
    .select("handle, occupation_mode")
    .eq("id", parsed.data.toProfileId)
    .maybeSingle();
  const href = person.data
    ? personPublicHref(person.data.handle, person.data.occupation_mode)
    : "/passport";
  await notify(auth.supabase, parsed.data.toProfileId, "recommendation", "New recommendation", undefined, href);
  revalidatePath("/people");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  revalidatePath("/passport");
  return { ok: true };
}

export async function requestRecommendation(input: unknown): Promise<ActionResult> {
  const parsed = recommendationRequestSchema.safeParse(input);
  if (!parsed.success) return fail("Choose who you are asking.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (parsed.data.toProfileId === auth.ctx.userId) return fail("Ask someone else to recommend you.");
  const { error } = await auth.supabase.from("recommendation_requests").insert({
    from_profile_id: auth.ctx.userId,
    to_profile_id: parsed.data.toProfileId,
  });
  if (error) return fail(error.message);
  const href = auth.ctx.profile
    ? personPublicHref(auth.ctx.profile.handle, auth.ctx.profile.occupationMode)
    : "/passport";
  await notify(
    auth.supabase,
    parsed.data.toProfileId,
    "recommendation_request",
    "Recommendation requested",
    `${auth.ctx.profile?.fullName ?? "Someone"} asked you to write a recommendation.`,
    href,
  );
  revalidatePath("/people");
  revalidatePath("/passport");
  return { ok: true };
}

export async function requestRecommendationByHandle(handle: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const normalized = normalizeHandle(handle);
  if (normalized.length < 2) return fail("Enter a public handle.");
  const person = await auth.supabase.from("public_profiles").select("id").eq("handle", normalized).maybeSingle();
  if (!person.data) return fail("No professional uses that handle.");
  return requestRecommendation({ toProfileId: person.data.id });
}

export async function recordOrganisationView(organisationId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.supabase) return { ok: true };
  await auth.supabase.from("organisation_views").insert({
    organisation_id: organisationId,
    viewer_profile_id: auth.ctx.userId,
  });
  return { ok: true };
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", auth.ctx.userId)
    .is("read_at", null);
  if (error) return fail(error.message);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function recordProjectView(projectId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (!auth.supabase) return { ok: true };
  if (auth.ctx.userId) {
    const limited = await limitAction(`project-view:${auth.ctx.userId}`, 60, 60_000);
    if (limited) return { ok: true };
  }
  await auth.supabase.from("project_views").insert({
    project_id: projectId,
    viewer_profile_id: auth.ctx.userId,
  });
  return { ok: true };
}

export async function setLocale(locale: string): Promise<ActionResult> {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, parseLocale(locale), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
  return { ok: true };
}
