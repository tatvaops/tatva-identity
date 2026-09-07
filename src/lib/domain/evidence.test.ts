import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evidenceTrustLabel } from "@/lib/domain/evidence";

describe("evidence trust labels", () => {
  it("keeps a bare claim as claimed", () => {
    const trust = evidenceTrustLabel({});
    assert.equal(trust.id, "claimed");
  });

  it("labels attached media as evidence-backed, not verified", () => {
    const trust = evidenceTrustLabel({ hasMedia: true, verificationState: "evidence_backed" });
    assert.equal(trust.id, "evidence_backed");
    assert.notEqual(trust.id, "verified");
  });

  it("only uses verified when an operator or issuer confirmed it", () => {
    const trust = evidenceTrustLabel({ operatorVerified: true, hasMedia: true });
    assert.equal(trust.id, "verified");
  });
});
