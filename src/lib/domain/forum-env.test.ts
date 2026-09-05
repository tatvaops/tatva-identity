import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allowedReturnOrigins, forumEnvStatus, vantageApiConfigured } from "./forum-env";

describe("forum env", () => {
  it("always allows localhost and the live IDENTITI origin, plus extras", () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = "https://tatva-identity-dev.vercel.app";
    process.env.VANTAGE_ALLOWED_RETURN_ORIGINS = "https://quotesense.withtatva.ai/";
    const origins = allowedReturnOrigins();
    assert.ok(origins.includes("http://localhost:3000"));
    assert.ok(origins.includes("https://tatva-identity-dev.vercel.app"));
    assert.ok(origins.includes("https://quotesense.withtatva.ai"));
  });

  it("treats the planned Vantage API as off when env is empty", () => {
    process.env.VANTAGE_API_BASE_URL = "";
    process.env.VANTAGE_FORUM_READ_TOKEN = "";
    assert.equal(vantageApiConfigured(), false);
    const status = forumEnvStatus();
    assert.equal(status.webhookPath, "/api/forum/webhooks/discussion-created");
    assert.ok(!("IDENTITI_FORUM_PRIVATE_KEY" in status));
  });
});
