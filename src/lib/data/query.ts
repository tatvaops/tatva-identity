import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { mapPublicProfile } from "@/lib/data/mappers";
import { publicErrorMessage } from "@/lib/public-error";
import { isBootstrapAdmin } from "@/lib/admin/bootstrap";
import type { AuthContext, ListOptions, PublicProfile, QueryMeta } from "@/lib/types/identity";

export function emptyMeta(error: string | null = null): QueryMeta {
  return { configured: supabaseConfigured(), error };
}

export async function getAuthContext(): Promise<AuthContext> {
  const configured = supabaseConfigured();
  const supabase = await createServerSupabase();
  if (!supabase) return { userId: null, profile: null, configured, isPlatformAdmin: false };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { userId: null, profile: null, configured, isPlatformAdmin: false };

  const { data, error } = await supabase.from("public_profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) {
    return {
      userId: user.id,
      profile: null,
      configured,
      isPlatformAdmin: isBootstrapAdmin({ userId: user.id }),
    };
  }

  const profile = mapPublicProfile(data);
  const adminRow = await supabase.from("platform_admins").select("profile_id").eq("profile_id", user.id).maybeSingle();
  return {
    userId: user.id,
    profile,
    configured,
    isPlatformAdmin: Boolean(adminRow.data?.profile_id) || isBootstrapAdmin({ userId: user.id, handle: profile.handle }),
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
