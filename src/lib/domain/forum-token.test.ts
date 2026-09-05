import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { createForumContextToken, verifyForumContextToken, hasScope, credentialScopes } from "./forum-token";
import { isAllowedReturnUrl } from "./forum";

describe("forum token", () => {
  before(() => {
    process.env.IDENTITI_FORUM_PRIVATE_KEY = "test-identiti-forum-secret";
    process.env.VANTAGE_ALLOWED_RETURN_ORIGINS = "";
  });

  it("signs and verifies an HS256 context token", () => {
    const minted = createForumContextToken({
      userId: "user-1",
      entityType: "service_brand",
      entityId: "brand-1",
      brandId: "brand-1",
      returnUrl: "http://localhost:3000/service-brands/aurum-habitat",
      now: 1_700_000_000,
    });
    assert.ok(!("error" in minted));
    const claims = verifyForumContextToken(minted.token, 1_700_000_010);
    assert.ok(!("error" in claims));
    assert.equal(claims.iss, "tatva-identiti");
    assert.equal(claims.aud, "vantage-forums");
    assert.equal(claims.entity_type, "service_brand");
    assert.ok(!minted.token.includes("IDENTITI_FORUM_PRIVATE_KEY"));
  });

  it("rejects an expired token and a bad return URL", () => {
    const minted = createForumContextToken({
      userId: "user-1",
      entityType: "product",
      entityId: "prod-1",
      brandId: "brand-1",
      productId: "prod-1",
      returnUrl: "http://localhost:3000/product-brands/nandi",
      now: 1_700_000_000,
      ttlSec: 30,
    });
    assert.ok(!("error" in minted));
    const expired = verifyForumContextToken(minted.token, 1_700_000_040);
    assert.ok("error" in expired);
    const bad = createForumContextToken({
      userId: "user-1",
      entityType: "service_brand",
      entityId: "brand-1",
      brandId: "brand-1",
      returnUrl: "https://evil.example/phish",
    });
    assert.ok("error" in bad);
  });

  it("allow-lists localhost and the live app origin", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://tatva-identity-dev.vercel.app";
    process.env.VANTAGE_ALLOWED_RETURN_ORIGINS = "https://quotesense.withtatva.ai";
    assert.equal(isAllowedReturnUrl("http://localhost:3000/forums"), true);
    assert.equal(isAllowedReturnUrl("https://tatva-identity-dev.vercel.app/service-brands/x"), true);
    assert.equal(isAllowedReturnUrl("https://quotesense.withtatva.ai/service-brands/x"), true);
    assert.equal(isAllowedReturnUrl("http://example.com/"), false);
    assert.equal(hasScope(credentialScopes("write"), "forum:links:create"), true);
    assert.equal(hasScope(credentialScopes("read"), "forum:links:create"), false);
  });
});
