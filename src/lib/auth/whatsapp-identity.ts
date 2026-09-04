import { e164India, phoneIdentityKey, phoneLoginEmail } from "@/lib/auth/phone";
import type { VisionProfile } from "@/lib/auth/tatva-vision";

export type VerifiedPhone = {
  ok: true;
  provider: "tatva-vision" | "local";
  digits: string;
  profile: VisionProfile;
};

export type VerifyFailure = { ok: false; error: string; status: number };

export function emptyVisionProfile(): VisionProfile {
  return { token: null, email: null, displayName: null, avatarUrl: null, phone: null };
}

export function sessionUserMeta(verified: VerifiedPhone) {
  const digits = verified.digits;
  const displayName = verified.profile.displayName?.trim() || "New professional";
  return {
    email: phoneLoginEmail(digits),
    phone: e164India(digits),
    fullName: displayName,
    identityKey: phoneIdentityKey(digits),
    authProvider: "whatsapp-otp",
    avatarUrl: verified.profile.avatarUrl,
    tatvaEmail: verified.profile.email,
  };
}
