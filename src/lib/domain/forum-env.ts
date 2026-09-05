function trimOrigin(value: string | undefined) {
  return (value ?? "").trim().replace(/\/$/, "");
}

export function vantageForumsOrigin() {
  return trimOrigin(process.env.NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN) || "https://vantage.withtatva.ai";
}

export function appOrigin() {
  return trimOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN) || "https://tatva-identity-dev.vercel.app";
}

export function vantageApiBaseUrl() {
  return trimOrigin(process.env.VANTAGE_API_BASE_URL);
}

export function vantageApiConfigured() {
  return Boolean(vantageApiBaseUrl() && process.env.VANTAGE_FORUM_READ_TOKEN?.trim());
}

export function allowedReturnOrigins() {
  const extras = (process.env.VANTAGE_ALLOWED_RETURN_ORIGINS ?? "")
    .split(",")
    .map((item) => trimOrigin(item))
    .filter(Boolean);
  return [...new Set(["http://localhost:3000", "https://tatva-identity-dev.vercel.app", appOrigin(), ...extras])];
}

/** Booleans only. Never return secret values. */
export function forumEnvStatus() {
  return {
    vantageOrigin: vantageForumsOrigin(),
    appOrigin: appOrigin(),
    signingKey: Boolean(process.env.IDENTITI_FORUM_PRIVATE_KEY?.trim()),
    writeToken: Boolean(process.env.VANTAGE_FORUM_WRITE_TOKEN?.trim()),
    readToken: Boolean(process.env.VANTAGE_FORUM_READ_TOKEN?.trim()),
    apiBaseUrl: vantageApiBaseUrl() || null,
    vantagePublicKeyPlaceholder: Boolean(process.env.VANTAGE_FORUM_PUBLIC_KEY?.trim()),
    extraReturnOrigins: allowedReturnOrigins(),
    webhookPath: "/api/forum/webhooks/discussion-created",
  };
}
