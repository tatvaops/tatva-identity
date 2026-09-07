import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessAdminConsole,
  canActForOrganisation,
  canConnectTo,
  canMutateOwnedResource,
  canViewApplication,
} from "@/lib/domain/authorization";

describe("authorisation invariants", () => {
  it("prevents user A from mutating user B", () => {
    assert.equal(canMutateOwnedResource("user-a", "user-b"), false);
    assert.equal(canMutateOwnedResource("user-a", "user-a"), true);
    assert.equal(canMutateOwnedResource(null, "user-a"), false);
  });

  it("prevents non-members from acting for an organisation", () => {
    assert.equal(
      canActForOrganisation("user-a", { profileId: "user-b", role: "owner", status: "active" }),
      false,
    );
    assert.equal(
      canActForOrganisation("user-a", { profileId: "user-a", role: "viewer", status: "active" }),
      false,
    );
    assert.equal(
      canActForOrganisation("user-a", { profileId: "user-a", role: "admin", status: "active" }),
      true,
    );
  });

  it("keeps applications private to the applicant or org staff", () => {
    assert.equal(canViewApplication({ userId: "a", isApplicant: false, isOrgStaff: false }), false);
    assert.equal(canViewApplication({ userId: "a", isApplicant: true, isOrgStaff: false }), true);
    assert.equal(canViewApplication({ userId: "b", isApplicant: false, isOrgStaff: true }), true);
    assert.equal(canViewApplication({ userId: null, isApplicant: true, isOrgStaff: true }), false);
  });

  it("keeps the admin console off ordinary accounts", () => {
    assert.equal(canAccessAdminConsole(false), false);
    assert.equal(canAccessAdminConsole(true), true);
  });

  it("blocks self-connections", () => {
    assert.equal(canConnectTo("user-a", "user-a"), false);
    assert.equal(canConnectTo("user-a", "user-b"), true);
  });
});
