import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isForumEntityType } from "@/lib/domain/identiti-routes";
import { hashCredential } from "@/lib/domain/forum-token";
import { rateLimit } from "@/lib/auth/rate-limit";
import { z } from "zod";

const webhookSchema = z.object({
  entity_type: z.string().max(40),
  entity_id: z.uuid(),
  forum_hub_id: z.string().max(120).optional().nullable(),
  forum_thread_id: z.string().max(120).optional().nullable(),
  thread_slug: z.string().trim().max(200).optional().nullable(),
  canonical_url: z.url().max(2000).optional().nullable(),
});

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

function sameSecret(provided: string, expected: string) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

async function authorized(token: string) {
  const write = process.env.VANTAGE_FORUM_WRITE_TOKEN?.trim() ?? "";
  if (write && sameSecret(token, write)) return true;
  const admin = createAdminSupabase();
  if (!admin || !token) return false;
  const hashed = hashCredential(token);
  const { data } = await admin
    .from("api_credentials")
    .select("id, scopes, revoked_at, expires_at")
    .eq("token_hash", hashed)
    .maybeSingle();
  if (!data || data.revoked_at) return false;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) return false;
  if (!(data.scopes ?? []).includes("forum:links:create")) return false;
  await admin.from("api_credentials").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

export async function POST(request: Request) {
  const limited = await rateLimit({ key: "forum-webhook", max: 120, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many webhook requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const token = bearer(request);
  if (!(await authorized(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = webhookSchema.safeParse(rawBody);
  if (!parsed.success || !isForumEntityType(parsed.data?.entity_type ?? "")) {
    return NextResponse.json({ error: "Invalid forum mapping payload" }, { status: 400 });
  }
  const body = parsed.data;
  const admin = createAdminSupabase();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const patch = {
    forum_hub_id: body.forum_hub_id ?? null,
    forum_thread_id: body.forum_thread_id ?? null,
    thread_slug: body.thread_slug ?? null,
    canonical_url: body.canonical_url ?? null,
    status: body.thread_slug || body.canonical_url ? "active" : "pending",
    updated_at: new Date().toISOString(),
  };
  const existing = await admin
    .from("forum_entity_links")
    .select("id")
    .eq("entity_type", body.entity_type)
    .eq("entity_id", body.entity_id)
    .maybeSingle();
  const { error } = existing.data
    ? await admin.from("forum_entity_links").update(patch).eq("id", existing.data.id)
    : await admin.from("forum_entity_links").insert({
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        ...patch,
      });
  if (error) return NextResponse.json({ error: "Could not save mapping" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
