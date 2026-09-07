import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isGigOccupation, personMessageHref, personPublicHref } from "./identiti-routes";

describe("identiti person routes", () => {
  it("sends gig occupations to gig-worker pages", () => {
    assert.equal(isGigOccupation("blue_collar"), true);
    assert.equal(personPublicHref("ravi", "contractor"), "/gig-workers/ravi");
    assert.equal(personPublicHref("priya", "white_collar"), "/professionals/priya");
  });

  it("starts messaging with a person id, not a handle query", () => {
    assert.equal(personMessageHref("abc-id", true, "/professionals/priya"), "/messages?person=abc-id");
    assert.equal(
      personMessageHref("abc-id", false, "/professionals/priya"),
      "/auth/sign-in?next=%2Fprofessionals%2Fpriya",
    );
  });
});
