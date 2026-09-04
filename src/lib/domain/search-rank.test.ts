import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankPeople, rankJobs } from "./search-rank";
import { calculatePassportStrength } from "./passport-strength";
import type { JobPost, PublicProfile } from "../types/identity";

const person = (over: Partial<PublicProfile> = {}): PublicProfile => ({
  id: "1",
  handle: "seed-ananya",
  fullName: "Ananya Iyer",
  headline: "Product designer",
  about: "Demonstration profile",
  avatarPath: null,
  coverPath: null,
  occupationMode: "white_collar",
  professionalTitle: "designer",
  classification: null,
  workerPassportId: null,
  currentOrganisationId: null,
  city: "Bengaluru",
  state: "Karnataka",
  country: "India",
  locality: "Indiranagar",
  languages: ["English"],
  preferredWorkLocations: ["Bengaluru"],
  workPreference: null,
  availabilityStatus: "open_to_opportunities",
  willingToRelocate: false,
  willingToTravel: true,
  arrangement: "hybrid",
  preferredRoles: ["Product designer"],
  preferredCities: [],
  website: null,
  emailVisibleTo: "none",
  aboutVisibleTo: "public",
  locationVisibleTo: "public",
  identityVerified: true,
  employmentVerified: true,
  tradeVerified: false,
  ...over,
});

describe("search ranking", () => {
  it("ranks a name match above a city-only match", () => {
    const ranked = rankPeople(
      [person({ id: "a", fullName: "City Only", headline: null, city: "Bengaluru", identityVerified: false, employmentVerified: false, availabilityStatus: "not_looking" }), person({ id: "b" })],
      "Ananya",
    );
    assert.equal(ranked[0]?.id, "b");
  });

  it("boosts easy-apply jobs when the title matches", () => {
    const job = (over: Partial<JobPost>): JobPost => ({
      id: "1",
      organisationId: "o",
      recruiterProfileId: null,
      title: "Site engineer",
      city: "Mumbai",
      employmentType: "permanent",
      experienceLabel: null,
      salaryLabel: null,
      skills: [],
      description: null,
      responsibilities: [],
      requirements: [],
      easyApply: false,
      closedAt: null,
      createdAt: new Date().toISOString(),
      ...over,
    });
    const ranked = rankJobs(
      [job({ id: "slow", title: "Site engineer" }), job({ id: "fast", title: "Site engineer", easyApply: true })],
      "engineer",
    );
    assert.equal(ranked[0]?.id, "fast");
  });
});

describe("passport strength", () => {
  it("is a completeness percent over real sections, not a hidden score", () => {
    const result = calculatePassportStrength({
      identityVerified: true,
      employmentVerified: false,
      skillCount: 1,
      publicCredentialCount: 0,
      projectCount: 1,
      recommendationCount: 0,
    });
    assert.equal(result.completeness, 50);
    assert.equal(result.components.length, 6);
  });
});
