import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isMissingProfileColumnError, pickCoreProfileUpdates } from "@/lib/data/profile-write";

describe("profile owner writes", () => {
  it("retries without columns that PostgREST has not granted yet", () => {
    assert.equal(isMissingProfileColumnError("Could not find the 'onboarding_step' column of 'profiles' in the schema cache"), true);
    assert.equal(isMissingProfileColumnError("permission denied for column specialisation"), true);
    assert.equal(isMissingProfileColumnError("That handle is already in use."), false);
    const core = pickCoreProfileUpdates({
      full_name: "Dev Tester",
      occupation_mode: "white_collar",
      onboarding_step: 1,
      specialisation: "Joinery",
    });
    assert.deepEqual(core, { full_name: "Dev Tester", occupation_mode: "white_collar" });
  });
});
