import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applicationStatusLabel,
  canApplicantWithdraw,
  canApplyToListing,
  applicantMaySetStatus,
  canOperatorTransition,
  normalizeApplicationStatus,
  operatorApplicationStatuses,
} from "./application-lifecycle";

describe("application lifecycle", () => {
  it("never presents hired as a public status label", () => {
    assert.equal(normalizeApplicationStatus("hired"), "accepted");
    assert.equal(applicationStatusLabel("hired"), "Selected");
  });

  it("keeps operator statuses honest", () => {
    assert.deepEqual(operatorApplicationStatuses("job"), [
      "submitted",
      "reviewing",
      "shortlisted",
      "interview",
      "accepted",
      "rejected",
    ]);
    assert.equal(applicationStatusLabel("interview"), "Interview");
    assert.equal(applicationStatusLabel("accepted"), "Selected");
    assert.ok(!operatorApplicationStatuses("job").includes("hired" as never));
  });

  it("blocks impossible operator transitions", () => {
    assert.equal(canOperatorTransition("submitted", "reviewing"), true);
    assert.equal(canOperatorTransition("accepted", "rejected"), false);
    assert.equal(canOperatorTransition("rejected", "submitted"), false);
    assert.equal(canOperatorTransition("withdrawn", "shortlisted"), false);
    assert.equal(canOperatorTransition("submitted", "withdrawn"), false);
    assert.equal(canApplicantWithdraw("submitted"), true);
    assert.equal(canApplicantWithdraw("accepted"), false);
  });

  it("blocks applications to closed or missing listings", () => {
    assert.equal(canApplyToListing({ closedAt: "2026-01-01T00:00:00Z" }), false);
    assert.equal(canApplyToListing({ exists: false }), false);
    assert.equal(canApplyToListing({ seats: 0 }), false);
    assert.equal(canApplyToListing({ closedAt: null, seats: 2 }), true);
    assert.equal(applicantMaySetStatus("withdrawn"), true);
    assert.equal(applicantMaySetStatus("accepted"), false);
  });
});
