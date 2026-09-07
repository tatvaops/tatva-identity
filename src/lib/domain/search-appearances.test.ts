import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { searchAppearanceProfileIds, shouldRecordSearchAppearance } from "./search-appearances";

describe("search appearances", () => {
  it("does not record anonymous or self appearances", () => {
    assert.equal(shouldRecordSearchAppearance({ searcherId: null, profileId: "a", query: "joinery" }), false);
    assert.equal(shouldRecordSearchAppearance({ searcherId: "a", profileId: "a", query: "joinery" }), false);
  });

  it("caps and de-duplicates ids, excluding the searcher", () => {
    const ids = searchAppearanceProfileIds(["a", "b", "b", "c"], "a", "steel");
    assert.deepEqual(ids, ["b", "c"]);
  });
});
