import { supabaseUrl } from "@/lib/supabase/env";

/** Seed Unsplash IDs that now 404. Remap so live cards keep a real photo. */
const REPLACED_UNSPLASH_IDS: Record<string, string> = {
  "photo-1615971677499-5467cb89d40f":
    "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80",
  "photo-1504307651254-35680f356988":
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80",
};

export function remapBrokenMediaUrl(path: string): string {
  for (const [id, replacement] of Object.entries(REPLACED_UNSPLASH_IDS)) {
    if (path.includes(id)) return replacement;
  }
  return path;
}

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  const resolved =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : (() => {
          const base = supabaseUrl();
          if (!base) return null;
          return `${base}/storage/v1/object/public/identity-public/${trimmed}`;
        })();
  return resolved ? remapBrokenMediaUrl(resolved) : null;
}
