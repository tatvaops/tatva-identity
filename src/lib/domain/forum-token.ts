import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isAllowedReturnUrl, type ForumEntityType } from "@/lib/domain/forum";

export type ForumTokenClaims = {
  iss: "tatva-identiti";
  aud: "vantage-forums";
  sub: string;
  entity_type: ForumEntityType;
  entity_id: string;
  brand_id: string;
  product_id?: string;
  return_url: string;
  iat: number;
  exp: number;
  jti: string;
};

function secret() {
  return process.env.IDENTITI_FORUM_PRIVATE_KEY?.trim() || "";
}

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createForumContextToken(input: {
  userId: string;
  entityType: ForumEntityType;
  entityId: string;
  brandId: string;
  productId?: string;
  returnUrl: string;
  now?: number;
  ttlSec?: number;
}): { token: string; claims: ForumTokenClaims } | { error: string } {
  if (!secret()) return { error: "Forum signing key is not configured." };
  if (!isAllowedReturnUrl(input.returnUrl)) return { error: "Return URL is not on the allow-list." };
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const claims: ForumTokenClaims = {
    iss: "tatva-identiti",
    aud: "vantage-forums",
    sub: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    brand_id: input.brandId,
    product_id: input.productId,
    return_url: input.returnUrl,
    iat: now,
    exp: now + (input.ttlSec ?? 8 * 60),
    jti: randomUUID(),
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(claims));
  const token = `${header}.${payload}.${sign(`${header}.${payload}`)}`;
  return { token, claims };
}

export function verifyForumContextToken(token: string, now = Math.floor(Date.now() / 1000)): ForumTokenClaims | { error: string } {
  if (!secret()) return { error: "Forum signing key is not configured." };
  const parts = token.split(".");
  if (parts.length !== 3) return { error: "Token is malformed." };
  const [header, payload, sig] = parts;
  const expected = sign(`${header}.${payload}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "Token signature is invalid." };
  let claims: ForumTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ForumTokenClaims;
  } catch {
    return { error: "Token payload is invalid." };
  }
  if (claims.iss !== "tatva-identiti" || claims.aud !== "vantage-forums") return { error: "Token issuer or audience is wrong." };
  if (claims.exp <= now) return { error: "Token has expired." };
  if (!isAllowedReturnUrl(claims.return_url)) return { error: "Return URL is not on the allow-list." };
  return claims;
}

export function hashCredential(plaintext: string) {
  return createHmac("sha256", "tatva-identiti-credential").update(plaintext).digest("hex");
}

export function credentialScopes(kind: "read" | "write") {
  return kind === "read"
    ? ["forum:hubs:read", "forum:threads:read", "forum:summaries:read"]
    : ["forum:hubs:create", "forum:drafts:create", "forum:links:create"];
}

export function hasScope(scopes: string[], needed: string) {
  return scopes.includes(needed);
}
