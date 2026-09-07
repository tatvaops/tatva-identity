function splitEnv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function bootstrapAdminHandles() {
  return splitEnv("PLATFORM_ADMIN_HANDLES").map((handle) => handle.replace(/^@/, "").toLowerCase());
}

export function bootstrapAdminUserIds() {
  return splitEnv("PLATFORM_ADMIN_USER_IDS");
}

/** Explicit open switch. Unset means open in development only; production stays locked. */
export function isPlatformAdminOpenToSignedIn() {
  const raw = (process.env.PLATFORM_ADMIN_OPEN ?? "").trim().toLowerCase();
  if (raw === "true" || raw === "1" || raw === "on") return true;
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return process.env.NODE_ENV !== "production";
}

export function isBootstrapAdmin(input: { userId: string; handle?: string | null }) {
  if (bootstrapAdminUserIds().includes(input.userId)) return true;
  const handle = input.handle?.replace(/^@/, "").toLowerCase();
  return Boolean(handle && bootstrapAdminHandles().includes(handle));
}

export function isPlatformOperator(input: { userId: string; handle?: string | null }) {
  return isPlatformAdminOpenToSignedIn() || isBootstrapAdmin(input);
}
