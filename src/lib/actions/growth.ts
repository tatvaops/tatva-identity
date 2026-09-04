"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { recommendationRequestSchema, recommendationSchema } from "@/lib/domain/workspace-schemas";
import { notify, limitAction } from "@/lib/actions/notify";

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
  return { ok: true };
}

export async function writeRecommendation(input: unknown): Promise<ActionResult> {
  const parsed = recommendationSchema.safeParse(input);
  if (!parsed.success) return fail("Write a short recommendation before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("recommendations").insert({
    from_profile_id: auth.ctx.userId,
    to_profile_id: parsed.data.toProfileId,
    relationship: parsed.data.relationship || null,
    body: parsed.data.body,
  });
  if (error) return fail(error.message);
  await notify(auth.supabase, parsed.data.toProfileId, "recommendation", "New recommendation", undefined, "/people");
  revalidatePath("/people");
  return { ok: true };
}

export async function requestRecommendation(input: unknown): Promise<ActionResult> {
  const parsed = recommendationRequestSchema.safeParse(input);
  if (!parsed.success) return fail("Choose who you are asking.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("recommendation_requests").insert({
    from_profile_id: auth.ctx.userId,
    to_profile_id: parsed.data.toProfileId,
  });
  if (error) return fail(error.message);
  await notify(
    auth.supabase,
    parsed.data.toProfileId,
    "recommendation_request",
    "Recommendation requested",
    `${auth.ctx.profile?.fullName ?? "Someone"} asked you to write a recommendation.`,
    `/people/${auth.ctx.profile?.handle ?? ""}`,
  );
  revalidatePath("/people");
  return { ok: true };
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

export async function setLocale(locale: string): Promise<ActionResult> {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, parseLocale(locale), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
  return { ok: true };
}
