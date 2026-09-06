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

/** Temporary: any signed-in account can open /admin until PLATFORM_ADMIN_OPEN=false. */
export function isPlatformAdminOpenToSignedIn() {
  const raw = (process.env.PLATFORM_ADMIN_OPEN ?? "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "off";
}

export function isBootstrapAdmin(input: { userId: string; handle?: string | null }) {
  if (bootstrapAdminUserIds().includes(input.userId)) return true;
  const handle = input.handle?.replace(/^@/, "").toLowerCase();
  return Boolean(handle && bootstrapAdminHandles().includes(handle));
}

export function isPlatformOperator(input: { userId: string; handle?: string | null }) {
  return isPlatformAdminOpenToSignedIn() || isBootstrapAdmin(input);
}
