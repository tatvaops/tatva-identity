import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canMessageApplicant,
  canReadConversation,
  canStartDirectConversation,
  isUuid,
} from "./messaging-rules";

describe("messaging authorisation", () => {
  it("rejects guessed or malformed conversation ids", () => {
    assert.equal(isUuid("not-a-uuid"), false);
    assert.equal(isUuid(""), false);
    assert.equal(isUuid("11111111-1111-4111-8111-111111111111"), true);
  });

  it("blocks self-messaging and missing actors", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    assert.equal(canStartDirectConversation(id, id), false);
    assert.equal(canStartDirectConversation(null, other), false);
    assert.equal(canStartDirectConversation(id, other), true);
  });

  it("does not treat membership as optional", () => {
    assert.equal(canReadConversation({ userId: "a", isMember: false }), false);
    assert.equal(canReadConversation({ userId: "a", isMember: true }), true);
    assert.equal(canReadConversation({ userId: null, isMember: true }), false);
  });

  it("keeps job/gig applicant threads on the hiring team", () => {
    const candidate = "22222222-2222-4222-8222-222222222222";
    assert.equal(canMessageApplicant({ userId: "a", isOrgStaff: false, candidateId: candidate }), false);
    assert.equal(canMessageApplicant({ userId: "a", isOrgStaff: true, candidateId: candidate }), true);
  });
});
