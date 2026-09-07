import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns granted to authenticated UPDATE in the foundation + gap-fill migrations. */
export const PROFILE_CORE_UPDATE_COLUMNS = new Set([
  "handle",
  "full_name",
  "headline",
  "about",
  "avatar_path",
  "cover_path",
  "occupation_mode",
  "classification",
  "current_organisation_id",
  "city",
  "state",
  "country",
  "locality",
  "languages",
  "preferred_work_locations",
  "work_preference",
  "availability_status",
  "willing_to_relocate",
  "willing_to_travel",
  "arrangement",
  "preferred_roles",
  "preferred_cities",
  "preferred_radius_km",
  "shift_preference",
  "notice_period",
  "daily_rate_inr",
  "monthly_salary_inr",
  "email_visible_to",
  "website",
  "professional_title",
  "about_visible_to",
  "location_visible_to",
]);

export function isMissingProfileColumnError(message?: string | null) {
  if (!message) return false;
  return /schema cache|permission denied|column |undefined column|does not exist|PGRST204/i.test(message);
}

export function pickCoreProfileUpdates(updates: Record<string, unknown>) {
  const core: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (PROFILE_CORE_UPDATE_COLUMNS.has(key)) core[key] = value;
  }
  return core;
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Record<string, unknown>,
) {
  if (Object.keys(updates).length === 0) return { error: null as { message: string } | null };
  const first = await supabase.from("profiles").update(updates).eq("id", userId);
  if (!first.error) return { error: null };
  if (!isMissingProfileColumnError(first.error.message)) return { error: first.error };

  const core = pickCoreProfileUpdates(updates);
  if (Object.keys(core).length === 0) return { error: null };
  const retry = await supabase.from("profiles").update(core).eq("id", userId);
  return { error: retry.error };
}
