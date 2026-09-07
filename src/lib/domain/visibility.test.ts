import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyProfilePrivacy, audienceAllows, publicViewer, showActivity, showConnections, showExperience, showProjects, viewerFromNetwork } from "@/lib/domain/visibility";
import type { PublicProfile } from "@/lib/types/identity";

describe("visibility audiences", () => {
  it("lets owners see private fields", () => {
    assert.equal(audienceAllows("private", { isOwner: true, isConnected: false, isRecruiter: false }), true);
  });

  it("hides private fields from the public", () => {
    assert.equal(audienceAllows("private", { isOwner: false, isConnected: false, isRecruiter: false }), false);
  });

  it("shows connection-only fields to connections", () => {
    assert.equal(audienceAllows("connections", { isOwner: false, isConnected: true, isRecruiter: false }), true);
    assert.equal(audienceAllows("connections", { isOwner: false, isConnected: false, isRecruiter: false }), false);
  });

  it("lets recruiters see recruiter-only fields", () => {
    assert.equal(audienceAllows("recruiters", { isOwner: false, isConnected: false, isRecruiter: true }), true);
    assert.equal(audienceAllows("recruiters", { isOwner: false, isConnected: false, isRecruiter: false }), false);
  });
});

describe("passport section visibility", () => {
  const profile = {
    experienceVisibleTo: "connections",
    projectsVisibleTo: "private",
    activityVisibleTo: "public",
  } as PublicProfile;

  it("hides private project history from strangers", () => {
    const stranger = viewerFromNetwork({ isOwner: false, connectionState: "connect" });
    assert.equal(showExperience(profile, stranger), false);
    assert.equal(showProjects(profile, stranger), false);
    assert.equal(showActivity(profile, stranger), true);
  });

  it("shows connection-only experience to accepted connections", () => {
    const connected = viewerFromNetwork({ isOwner: false, connectionState: "connected" });
    assert.equal(showExperience(profile, connected), true);
  });

  it("keeps the connection list private unless the audience allows it", () => {
    const hidden = { connectionsVisibleTo: "private" } as PublicProfile;
    assert.equal(showConnections(hidden, publicViewer()), false);
    assert.equal(
      showConnections(hidden, viewerFromNetwork({ isOwner: true, connectionState: "connected" })),
      true,
    );
  });
});

describe("availability privacy", () => {
  it("hides availability from the public when set to private", () => {
    const hidden = applyProfilePrivacy(
      {
        availabilityVisibleTo: "private",
        availabilityStatus: "open_to_gigs",
        preferredRoles: ["Supervisor"],
        preferredCities: ["Pune"],
        aboutVisibleTo: "public",
        locationVisibleTo: "public",
      } as PublicProfile,
      publicViewer(),
    );
    assert.equal(hidden.availabilityStatus, "not_looking");
    assert.deepEqual(hidden.preferredRoles, []);
  });
});
