import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/data/query";
import { publicActionError } from "@/lib/public-error";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export function fail(error: string): ActionResult {
  return { ok: false, error: publicActionError(error) };
}

export async function requireUser() {
  const ctx = await getAuthContext();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured." as const, supabase: null, ctx };
  if (!ctx.userId || !ctx.profile) return { error: "Sign in to continue." as const, supabase, ctx };
  return { error: null, supabase, ctx };
}
