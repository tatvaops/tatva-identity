const OTP = /^\d{6,8}$/;

function allowedVerifyHost(hostname: string, supabaseOrigin: string) {
  try {
    return hostname === new URL(supabaseOrigin).hostname;
  } catch {
    return false;
  }
}

/** Pull the real destination out of a Gmail `google.com/url?q=` wrapper. */
export function unwrapSignInValue(raw: string) {
  const trimmed = raw.trim().replace(/^<|>$/g, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname === "www.google.com" && url.pathname === "/url") {
      const nested = url.searchParams.get("q");
      if (nested) return nested;
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export type ParsedSignInSecret =
  | { kind: "otp"; token: string }
  | { kind: "tokenHash"; tokenHash: string; type: "email" | "magiclink" }
  | { kind: "verifyUrl"; href: string }
  | { kind: "callback"; href: string }
  | { kind: "unknown" };

export function parseSignInSecret(
  raw: string,
  opts: { appOrigin: string; supabaseUrl: string },
): ParsedSignInSecret {
  const value = unwrapSignInValue(raw);
  if (OTP.test(value)) return { kind: "otp", token: value };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { kind: "unknown" };
  }

  if (url.origin === opts.appOrigin && url.pathname.startsWith("/auth/callback")) {
    return { kind: "callback", href: url.toString() };
  }

  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (tokenHash && (type === "email" || type === "magiclink")) {
    return { kind: "tokenHash", tokenHash, type };
  }

  const token = url.searchParams.get("token");
  if (
    token &&
    url.pathname.includes("/auth/v1/verify") &&
    allowedVerifyHost(url.hostname, opts.supabaseUrl)
  ) {
    const redirectTo = `${opts.appOrigin}/auth/callback`;
    url.searchParams.set("redirect_to", redirectTo);
    return { kind: "verifyUrl", href: url.toString() };
  }

  return { kind: "unknown" };
}
