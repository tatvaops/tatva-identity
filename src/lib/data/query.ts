import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { mapPublicProfile } from "@/lib/data/mappers";
import { publicErrorMessage } from "@/lib/public-error";
import { isBootstrapAdmin, isPlatformAdminOpenToSignedIn } from "@/lib/admin/bootstrap";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import type { AuthContext, ListOptions, PublicProfile, QueryMeta } from "@/lib/types/identity";

export function emptyMeta(error: string | null = null): QueryMeta {
  return { configured: supabaseConfigured(), error };
}

export async function getAuthContext(): Promise<AuthContext> {
  const configured = supabaseConfigured();
  const supabase = await createServerSupabase();
  if (!supabase) return { userId: null, profile: null, configured, isPlatformAdmin: false, unreadNotificationCount: 0 };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { userId: null, profile: null, configured, isPlatformAdmin: false, unreadNotificationCount: 0 };

  const [{ data, error }, unread] = await Promise.all([
    supabase.from("public_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .is("read_at", null),
  ]);
  const unreadNotificationCount = unread.count ?? 0;
  let row = data;
  if (error || !row) {
    row = null;
    const repaired = await ensureProfileForUser(supabase, user.id);
    if (repaired) {
      const profile = repaired;
      const adminRow = await supabase.from("platform_admins").select("profile_id").eq("profile_id", user.id).maybeSingle();
      return {
        userId: user.id,
        profile,
        configured,
        isPlatformAdmin:
          isPlatformAdminOpenToSignedIn() ||
          Boolean(adminRow.data?.profile_id) ||
          isBootstrapAdmin({ userId: user.id, handle: profile.handle }),
        unreadNotificationCount,
      };
    }
    return {
      userId: user.id,
      profile: null,
      configured,
      isPlatformAdmin: isPlatformAdminOpenToSignedIn() || isBootstrapAdmin({ userId: user.id }),
      unreadNotificationCount,
    };
  }

  const profile = mapPublicProfile(row);
  const adminRow = await supabase.from("platform_admins").select("profile_id").eq("profile_id", user.id).maybeSingle();
  return {
    userId: user.id,
    profile,
    configured,
    isPlatformAdmin:
      isPlatformAdminOpenToSignedIn() ||
      Boolean(adminRow.data?.profile_id) ||
      isBootstrapAdmin({ userId: user.id, handle: profile.handle }),
    unreadNotificationCount,
  };
}

export type ListResult<T> = { data: T[]; meta: QueryMeta; total?: number };
export type ItemResult<T> = { data: T | null; meta: QueryMeta };

export function listOk<T>(data: T[], total?: number): ListResult<T> {
  return { data, meta: emptyMeta(), total };
}

export function listFail<T>(message?: string): ListResult<T> {
  void message;
  return { data: [], meta: emptyMeta(publicErrorMessage()) };
}

export function itemOk<T>(data: T | null): ItemResult<T> {
  return { data, meta: emptyMeta() };
}

export function itemFail<T>(message?: string): ItemResult<T> {
  void message;
  return { data: null, meta: emptyMeta(publicErrorMessage()) };
}

export function unconfiguredList<T>(): ListResult<T> {
  return { data: [], meta: emptyMeta() };
}

export function unconfiguredItem<T>(): ItemResult<T> {
  return { data: null, meta: emptyMeta() };
}

export function pageRange(options: ListOptions = {}, fallbackSize?: number) {
  const pageSize = options.pageSize ?? fallbackSize;
  if (!pageSize) return null;
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1, page, pageSize };
}

export type { PublicProfile };
