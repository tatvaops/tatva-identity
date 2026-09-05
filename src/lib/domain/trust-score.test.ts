import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateTrustScore } from "./trust-score";

describe("trust score", () => {
  it("stays insufficient without reviews or verified projects", () => {
    const score = calculateTrustScore({
      gstVerified: true,
      kycVerified: true,
      verifiedProjects: 0,
      verifiedReviews: 0,
      hasQcNotes: false,
      onTimePct: null,
      qualityRating: null,
    });
    assert.equal(score.insufficient, true);
    assert.equal(score.score, null);
  });

  it("returns a labelled breakdown from public evidence", () => {
    const score = calculateTrustScore({
      gstVerified: true,
      kycVerified: true,
      verifiedProjects: 2,
      verifiedReviews: 18,
      hasQcNotes: true,
      onTimePct: 92,
      qualityRating: 4.6,
    });
    assert.equal(score.insufficient, false);
    assert.match(score.label, /\/100$/);
    assert.ok((score.score ?? 0) > 70);
    assert.ok(score.breakdown.every((row) => row.label.length > 0));
  });
});
