import { consumeLocalOtp, issueLocalOtp } from "@/lib/auth/local-otp";
import { emptyVisionProfile, type VerifiedPhone, type VerifyFailure } from "@/lib/auth/whatsapp-identity";
import {
  parseVisionProfile,
  visionFetchMe,
  visionOtpEnabled,
  visionSendOtp,
  visionVerifyOtp,
} from "@/lib/auth/tatva-vision";

export async function sendPhoneOtp(digits: string) {
  if (!visionOtpEnabled()) {
    const otp = await issueLocalOtp(digits);
    const showDev = process.env.NODE_ENV !== "production";
    return {
      ok: true as const,
      provider: "local" as const,
      devOtp: showDev ? otp : undefined,
    };
  }

  const result = await visionSendOtp(digits);
  if (!result.ok) {
    return { ok: false as const, error: "Could not send the WhatsApp code. Try again in a moment." };
  }
  return { ok: true as const, provider: "tatva-vision" as const };
}

export async function verifyPhoneOtp(digits: string, otp: string): Promise<VerifiedPhone | VerifyFailure> {
  if (!visionOtpEnabled()) {
    const local = await consumeLocalOtp(digits, otp);
    if (!local.ok) return { ok: false, error: local.error, status: 401 };
    return { ok: true, provider: "local", digits, profile: emptyVisionProfile() };
  }

  const result = await visionVerifyOtp(digits, otp);
  if (!result.ok) {
    return { ok: false, error: "That code is wrong or expired. Request a new one.", status: 401 };
  }

  let profile = parseVisionProfile(result.json);
  if (profile.token && !profile.displayName && !profile.email) {
    const extra = await visionFetchMe(profile.token);
    if (extra) profile = { ...profile, ...extra, token: profile.token };
  }

  return { ok: true, provider: "tatva-vision", digits, profile };
}
