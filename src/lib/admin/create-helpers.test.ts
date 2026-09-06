import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidHandle, suggestedHandle, splitList } from "./create-helpers";

describe("suggestedHandle", () => {
  it("slugifies a full name", () => {
    assert.equal(suggestedHandle("Priya Nair"), "priya-nair");
  });

  it("pads a one-letter name so it matches handle format", () => {
    assert.equal(isValidHandle(suggestedHandle("A")), true);
  });

  it("rejects invalid handles", () => {
    assert.equal(isValidHandle("-bad"), false);
    assert.equal(isValidHandle("ab"), false);
  });
});

describe("splitList", () => {
  it("splits comma and newline lists", () => {
    assert.deepEqual(splitList("cad,  revit\nestimating"), ["cad", "revit", "estimating"]);
  });
});
