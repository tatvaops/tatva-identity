export const AUTH_NEXT_COOKIE = "tatva-auth-next";

export function safeNextPath(value?: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/feed";
  }
  return value;
}
