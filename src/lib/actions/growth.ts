"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { recommendationSchema } from "@/lib/domain/workspace-schemas";

export async function recordProfileViewAction(viewedProfileId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return { ok: true };
  if (auth.ctx.userId === viewedProfileId) return { ok: true };
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
  revalidatePath("/people");
  return { ok: true };
}

export async function setLocale(locale: string): Promise<ActionResult> {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, parseLocale(locale), { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
  return { ok: true };
}
