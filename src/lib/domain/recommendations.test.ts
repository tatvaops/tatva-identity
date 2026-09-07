import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankSuggestions, relevanceScore } from "@/lib/domain/recommendations";
import type { PublicProfile } from "@/lib/types/identity";

function person(partial: Partial<PublicProfile>): PublicProfile {
  return {
    id: "a",
    handle: "person",
    fullName: "Person",
    headline: null,
    about: null,
    avatarPath: null,
    coverPath: null,
    occupationMode: "white_collar",
    professionalTitle: null,
    classification: null,
    workerPassportId: null,
    currentOrganisationId: null,
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    locality: null,
    languages: [],
    preferredWorkLocations: [],
    workPreference: null,
    availabilityStatus: "open_to_opportunities",
    willingToRelocate: false,
    willingToTravel: false,
    arrangement: "on_site",
    preferredRoles: [],
    preferredCities: [],
    website: null,
    emailVisibleTo: "none",
    aboutVisibleTo: "public",
    locationVisibleTo: "public",
    availabilityVisibleTo: "public",
    connectionsVisibleTo: "public",
    activityVisibleTo: "public",
    projectsVisibleTo: "public",
    experienceVisibleTo: "public",
    yearsExperience: null,
    specialisation: null,
    industriesServed: ["interiors"],
    professionalInterests: [],
    identityVerified: false,
    employmentVerified: false,
    tradeVerified: false,
    ...partial,
  };
}

describe("recommendation relevance", () => {
  it("scores shared city, skills and organisation above an unrelated profile", () => {
    const viewer = person({ id: "v" });
    const nearby = person({ id: "n", handle: "nearby" });
    const far = person({ id: "f", handle: "far", city: "Pune", industriesServed: ["steel"] });
    const nearbyScore = relevanceScore(viewer, nearby, {
      sharedSkillCount: 2,
      mutualConnectionCount: 1,
      sharedOrganisation: true,
    });
    const farScore = relevanceScore(viewer, far, {
      sharedSkillCount: 0,
      mutualConnectionCount: 0,
      sharedOrganisation: false,
    });
    assert.ok(nearbyScore > farScore);
  });

  it("ranks higher scores first", () => {
    const ranked = rankSuggestions(
      [
        { id: "low", score: 1 },
        { id: "high", score: 9 },
      ],
      2,
    );
    assert.equal(ranked[0]?.id, "high");
  });
});
