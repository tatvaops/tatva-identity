import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { kvDel, kvGet, kvIncr, kvSet } from "@/lib/auth/kv";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function hmacSecret() {
  return process.env.OTP_HMAC_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "tatva-local-otp";
}

function otpHash(digits: string, otp: string) {
  return createHmac("sha256", hmacSecret()).update(`${digits}:${otp}`).digest("hex");
}

function hashesEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function issueLocalOtp(digits: string) {
  const otp = String(randomInt(100000, 1000000));
  await kvSet(`otp:local:${digits}`, otpHash(digits, otp), OTP_TTL_MS);
  await kvDel(`otp:local:tries:${digits}`);
  return otp;
}

export async function consumeLocalOtp(digits: string, otp: string) {
  const stored = await kvGet(`otp:local:${digits}`);
  if (!stored) return { ok: false as const, error: "That code is wrong or expired. Request a new one." };

  const tries = await kvIncr(`otp:local:tries:${digits}`, OTP_TTL_MS);
  if (tries > MAX_ATTEMPTS) {
    await kvDel(`otp:local:${digits}`);
    return { ok: false as const, error: "Too many wrong codes. Request a new one." };
  }

  if (!hashesEqual(stored, otpHash(digits, otp))) {
    return { ok: false as const, error: "That code is wrong or expired. Request a new one." };
  }

  await kvDel(`otp:local:${digits}`);
  await kvDel(`otp:local:tries:${digits}`);
  return { ok: true as const };
}
