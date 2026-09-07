import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampOnboardingStep,
  handleIsGenerated,
  handleIsReserved,
  normalizeHandle,
  occupationFromTitle,
  ONBOARDING_STEPS,
  profileNeedsIdentitySetup,
  shouldClaimOnboardingHandle,
} from "@/lib/domain/onboarding";

describe("onboarding helpers", () => {
  it("normalises handles to the public format", () => {
    assert.equal(normalizeHandle("@Tejas Rao"), "tejas-rao");
    assert.equal(normalizeHandle("  Ananya  "), "ananya");
  });

  it("rejects reserved and generated handles", () => {
    assert.equal(handleIsReserved("admin"), true);
    assert.equal(handleIsReserved("ananya"), false);
    assert.equal(handleIsGenerated("u-a1b2c3d4e5f6"), true);
    assert.equal(handleIsGenerated("ananya-rao"), false);
  });

  it("sends new accounts through identity setup until they name themselves", () => {
    assert.equal(profileNeedsIdentitySetup({ handle: "u-abc", fullName: "New professional" }), true);
    assert.equal(profileNeedsIdentitySetup({ handle: "u-abc", fullName: "Aditi Sharma" }), false);
  });

  it("maps titles onto occupation routes", () => {
    assert.equal(occupationFromTitle("gig_worker"), "blue_collar");
    assert.equal(occupationFromTitle("architect"), "white_collar");
    assert.equal(occupationFromTitle("contractor"), "contractor");
  });

  it("keeps onboarding on a short required path", () => {
    assert.equal(ONBOARDING_STEPS.length, 7);
    assert.equal(clampOnboardingStep(-3), 0);
    assert.equal(clampOnboardingStep(99), 6);
    assert.equal(ONBOARDING_STEPS[0]?.id, "identity");
    assert.equal(ONBOARDING_STEPS[6]?.id, "publish");
  });

  it("does not claim a handle until the person actually chooses one", () => {
    assert.equal(shouldClaimOnboardingHandle("dev-tester", true), false);
    assert.equal(shouldClaimOnboardingHandle("", false), false);
    assert.equal(shouldClaimOnboardingHandle("u-abc123def456", false), false);
    assert.equal(shouldClaimOnboardingHandle("dev-tester", false), true);
  });
});
