import { mapPublicProfile } from "@/lib/data/mappers";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { PublicProfile } from "@/lib/types/identity";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureProfileForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<PublicProfile | null> {
  const rpc = await supabase.rpc("ensure_own_profile");
  if (!rpc.error && rpc.data) {
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    if (row) return mapPublicProfile(row);
  }

  const existing = await supabase.from("public_profiles").select("*").eq("id", userId).maybeSingle();
  if (existing.data) return mapPublicProfile(existing.data);

  const admin = createAdminSupabase();
  if (!admin) return null;
  const generated = `u-${userId.replaceAll("-", "").slice(0, 12)}`;
  const user = await admin.auth.admin.getUserById(userId);
  const fullName =
    (user.data.user?.user_metadata?.full_name as string | undefined)?.trim() || "New professional";
  await admin.from("profiles").insert({
    id: userId,
    handle: generated,
    full_name: fullName,
  });
  const repaired = await admin.from("public_profiles").select("*").eq("id", userId).maybeSingle();
  return repaired.data ? mapPublicProfile(repaired.data) : null;
}
