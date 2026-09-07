import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeNextPath } from "@/lib/auth/next-path";

describe("post-auth redirects", () => {
  it("allows in-app paths", () => {
    assert.equal(safeNextPath("/passport"), "/passport");
    assert.equal(safeNextPath("/jobs/create"), "/jobs/create");
    assert.equal(safeNextPath("/messages?c=11111111-1111-4111-8111-111111111111"), "/messages?c=11111111-1111-4111-8111-111111111111");
  });

  it("rejects open redirects", () => {
    assert.equal(safeNextPath("https://evil.example"), "/feed");
    assert.equal(safeNextPath("//evil.example"), "/feed");
    assert.equal(safeNextPath("/\\evil.example"), "/feed");
    assert.equal(safeNextPath("/onboarding?next=https://evil.example"), "/feed");
    assert.equal(safeNextPath(null), "/feed");
  });
});
