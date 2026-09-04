const DEFAULT_BASE = "https://devopsapi.withtatva.ai";
const TIMEOUT_MS = 8000;

export type VisionProfile = {
  token: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
};

function baseUrl() {
  return (process.env.TATVA_USERS_API_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, "");
}

export function visionOtpEnabled() {
  return process.env.TATVA_VISION_OTP_ENABLED !== "false";
}

async function postJson(path: string, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = { message: text };
      }
    }
    return { ok: response.ok, status: response.status, json };
  } finally {
    clearTimeout(timer);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function parseVisionProfile(payload: unknown): VisionProfile {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const user = asRecord(data.user) ?? asRecord(root.user) ?? {};
  return {
    token: pickString(data.token, data.accessToken, data.access_token, root.token, root.accessToken),
    email: pickString(user.email, data.email),
    displayName: pickString(user.fullName, user.name, user.displayName, data.fullName, data.name),
    avatarUrl: pickString(user.profilePicture, user.avatarUrl, user.image, data.profilePicture),
    phone: pickString(user.phone, user.phoneNumber, data.phone),
  };
}

export async function visionSendOtp(digits: string) {
  return postJson("/users/api/auth/vision/send-otp", { phoneNumber: digits });
}

export async function visionVerifyOtp(digits: string, otp: string) {
  return postJson("/users/api/auth/vision/verify-otp", { phoneNumber: digits, otp });
}

export async function visionFetchMe(token: string) {
  const paths = ["/users/api/auth/me", "/users/api/users/me", "/users/api/user/me"];
  for (const path of paths) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${baseUrl()}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) continue;
      const json: unknown = await response.json().catch(() => null);
      const profile = parseVisionProfile(json);
      if (profile.displayName || profile.email || profile.avatarUrl) return profile;
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

