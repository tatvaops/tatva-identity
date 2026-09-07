export const AUTH_NEXT_COOKIE = "tatva-auth-next";

export function safeNextPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/feed";
  }
  if (value.includes("://") || value.includes("\\") || value.includes("%00") || /\s/.test(value)) {
    return "/feed";
  }
  return value;
}
