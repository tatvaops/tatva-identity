import { supabaseUrl } from "@/lib/supabase/env";

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = supabaseUrl();
  if (!base) return null;
  return `${base}/storage/v1/object/public/identity-public/${path}`;
}
