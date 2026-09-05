export type ForumEntityType = "service_brand" | "product_brand" | "product";

export type ForumLink = {
  entityType: ForumEntityType;
  entityId: string;
  brandId: string | null;
  productId: string | null;
  forumHubId: string | null;
  forumThreadId: string | null;
  threadSlug: string | null;
  canonicalUrl: string | null;
  status: "pending" | "active" | "failed";
};

export function vantageForumsOrigin() {
  return (process.env.NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN ?? "https://vantage.withtatva.ai").replace(/\/$/, "");
}

export function existingThreadUrl(link: ForumLink | null) {
  if (!link) return null;
  if (link.canonicalUrl) return link.canonicalUrl;
  if (link.threadSlug) return `${vantageForumsOrigin()}/forums/${link.threadSlug}`;
  return null;
}

export function newDiscussionUrl(token: string) {
  return `${vantageForumsOrigin()}/forums/new?context=${encodeURIComponent(token)}`;
}

export function allowedReturnOrigins() {
  const raw = process.env.VANTAGE_ALLOWED_RETURN_ORIGINS ?? "";
  const extras = raw.split(",").map((item) => item.trim()).filter(Boolean);
  return ["http://localhost:3000", "https://tatva-identity-dev.vercel.app", ...extras];
}

export function isAllowedReturnUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.protocol === "http:" && parsed.hostname !== "localhost") return false;
    return allowedReturnOrigins().some((origin) => {
      const allowed = new URL(origin);
      return parsed.origin === allowed.origin;
    });
  } catch {
    return false;
  }
}

export function forumHubKey(entityType: ForumEntityType, entityId: string) {
  return `${entityType}:${entityId}`;
}
