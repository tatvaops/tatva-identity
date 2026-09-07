import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applicationStatusLabel,
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
});
