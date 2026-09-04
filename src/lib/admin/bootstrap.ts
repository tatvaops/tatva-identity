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

export function isBootstrapAdmin(input: { userId: string; handle?: string | null }) {
  if (bootstrapAdminUserIds().includes(input.userId)) return true;
  const handle = input.handle?.replace(/^@/, "").toLowerCase();
  return Boolean(handle && bootstrapAdminHandles().includes(handle));
}
