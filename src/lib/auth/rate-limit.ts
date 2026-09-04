import { kvIncr } from "@/lib/auth/kv";

export async function rateLimit(opts: { key: string; max: number; windowMs: number }) {
  const count = await kvIncr(opts.key, opts.windowMs);
  if (count > opts.max) {
    return { ok: false as const, retryAfterSec: Math.ceil(opts.windowMs / 1000) };
  }
  return { ok: true as const };
}

export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
