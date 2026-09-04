import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { normalizeIndianMobile } from "@/lib/auth/phone";
import { sendPhoneOtp } from "@/lib/auth/phone-otp";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";

const bodySchema = z.object({
  phone: z.string().min(10).max(16),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  const digits = parsed.success ? normalizeIndianMobile(parsed.data.phone) : null;
  if (!digits) {
    return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });
  }

  const ip = clientIp(request.headers);
  const phoneLimit = await rateLimit({ key: `otp:send:phone:${digits}`, max: 5, windowMs: 15 * 60 * 1000 });
  const ipLimit = await rateLimit({ key: `otp:send:ip:${ip}`, max: 5, windowMs: 15 * 60 * 1000 });
  if (!phoneLimit.ok || !ipLimit.ok) {
    return NextResponse.json({ error: "Too many codes requested. Wait a few minutes." }, { status: 429 });
  }

  try {
    const result = await sendPhoneOtp(digits);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      provider: result.provider,
      ...(result.devOtp ? { dev_otp: result.devOtp } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Could not send the WhatsApp code. Try again in a moment." }, { status: 500 });
  }
}
