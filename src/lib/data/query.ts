import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { mapPublicProfile } from "@/lib/data/mappers";
import { publicErrorMessage } from "@/lib/public-error";
import type { AuthContext, PublicProfile, QueryMeta } from "@/lib/types/identity";

export function emptyMeta(error: string | null = null): QueryMeta {
  return { configured: supabaseConfigured(), error };
}

export async function getAuthContext(): Promise<AuthContext> {
  const configured = supabaseConfigured();
  const supabase = await createServerSupabase();
  if (!supabase) return { userId: null, profile: null, configured };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { userId: null, profile: null, configured };

  const { data, error } = await supabase.from("public_profiles").select("*").eq("id", user.id).maybeSingle();
  if (error || !data) return { userId: user.id, profile: null, configured };

  return { userId: user.id, profile: mapPublicProfile(data), configured };
}

export type ListResult<T> = { data: T[]; meta: QueryMeta };
export type ItemResult<T> = { data: T | null; meta: QueryMeta };

export function listOk<T>(data: T[]): ListResult<T> {
  return { data, meta: emptyMeta() };
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

export type { PublicProfile };
