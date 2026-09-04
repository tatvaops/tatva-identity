import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { adminSearchTerm } from "./search";

describe("adminSearchTerm", () => {
  it("strips PostgREST filter characters", () => {
    assert.equal(adminSearchTerm("ananya,id.eq.1"), "ananya id eq 1");
    assert.equal(adminSearchTerm("ananya) ,(or"), "ananya or");
    assert.equal(adminSearchTerm("  %seed_ananya%  "), "seed_ananya");
  });

  it("caps length", () => {
    assert.equal(adminSearchTerm("a".repeat(200)).length, 64);
  });
});
