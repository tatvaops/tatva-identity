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

/** Unset or true: any signed-in user can open /admin. Set false to lock to named operators. */
export function isPlatformAdminOpenToSignedIn(env: NodeJS.ProcessEnv = process.env) {
  const raw = (env.PLATFORM_ADMIN_OPEN ?? "").trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  return true;
}

export function isBootstrapAdmin(input: { userId: string; handle?: string | null }) {
  if (bootstrapAdminUserIds().includes(input.userId)) return true;
  const handle = input.handle?.replace(/^@/, "").toLowerCase();
  return Boolean(handle && bootstrapAdminHandles().includes(handle));
}

export function isPlatformOperator(input: { userId: string; handle?: string | null }) {
  return isPlatformAdminOpenToSignedIn() || isBootstrapAdmin(input);
}
