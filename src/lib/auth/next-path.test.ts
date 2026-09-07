import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeNextPath } from "@/lib/auth/next-path";

describe("post-auth redirects", () => {
  it("allows in-app paths", () => {
    assert.equal(safeNextPath("/passport"), "/passport");
    assert.equal(safeNextPath("/jobs/create"), "/jobs/create");
  });

  it("rejects open redirects", () => {
    assert.equal(safeNextPath("https://evil.example"), "/feed");
    assert.equal(safeNextPath("//evil.example"), "/feed");
    assert.equal(safeNextPath("/\\evil.example"), "/feed");
    assert.equal(safeNextPath(null), "/feed");
  });
});
