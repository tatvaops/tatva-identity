import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createWhatsAppSession } from "@/lib/auth/create-whatsapp-session";
import { normalizeIndianMobile } from "@/lib/auth/phone";
import { verifyPhoneOtp } from "@/lib/auth/phone-otp";
import { clientIp, rateLimit } from "@/lib/auth/rate-limit";

const bodySchema = z.object({
  phone: z.string().min(10).max(16),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the 6-digit code from WhatsApp." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  const digits = parsed.success ? normalizeIndianMobile(parsed.data.phone) : null;
  const code = parsed.success ? parsed.data.code : null;
  if (!digits || !code) {
    return NextResponse.json({ error: "Enter a valid phone number and 6-digit code." }, { status: 400 });
  }

  const ip = clientIp(request.headers);
  const limited = await rateLimit({
    key: `otp:verify:${digits}:${ip}`,
    max: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  }

  try {
    const verified = await verifyPhoneOtp(digits, code);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }
    return createWhatsAppSession(request, verified);
  } catch {
    return NextResponse.json({ error: "Could not verify the code. Try again in a moment." }, { status: 500 });
  }
}
