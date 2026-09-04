import { fail, type ActionResult } from "@/lib/actions/shared";
import { rateLimit } from "@/lib/auth/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function notify(
  supabase: SupabaseClient,
  target: string | null | undefined,
  kind: string,
  title: string,
  body?: string,
  href?: string,
) {
  if (!target) return;
  await supabase.rpc("notify_profile", {
    target,
    kind,
    title,
    body: body ?? null,
    href: href ?? null,
  });
}

export async function audit(supabase: SupabaseClient, action: string, entityKind: string, entityId: string) {
  await supabase.rpc("write_audit", {
    action,
    entity_kind: entityKind,
    entity_id: entityId,
  });
}

export async function trackEvent(supabase: SupabaseClient, name: string, entityKind?: string, entityId?: string) {
  await supabase.rpc("record_product_event", {
    name,
    entity_kind: entityKind ?? null,
    entity_id: entityId ?? null,
  });
}

export async function limitAction(key: string, max: number, windowMs: number): Promise<ActionResult | null> {
  const result = await rateLimit({ key, max, windowMs });
  if (!result.ok) return fail("Too many attempts. Wait a minute and try again.");
  return null;
}
