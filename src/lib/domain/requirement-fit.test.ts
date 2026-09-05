import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateRequirementFit } from "./requirement-fit";

describe("requirement fit", () => {
  it("marks premium interiors as a strong design match for a design+execution brand", () => {
    const fit = calculateRequirementFit("premium_interiors", {
      designCapability: true,
      executionCapability: true,
      typicalMinInr: 1_500_000,
      typicalMaxInr: 18_000_000,
      serviceAreas: ["Bengaluru"],
      servingRegions: "Bengaluru, Mysuru",
      deliverySlots: 3,
      capabilityChips: ["Turnkey interiors"],
      projectTypes: ["interior", "villa"],
    });
    assert.equal(fit.cards.find((card) => card.id === "design")?.level, "strong");
    assert.equal(fit.cards.find((card) => card.id === "budget")?.level, "strong");
    assert.ok(fit.overall !== "clarify");
  });

  it("asks for clarification when budget and design sit outside the brief", () => {
    const fit = calculateRequirementFit("villa_construction", {
      designCapability: false,
      executionCapability: false,
      typicalMinInr: 200_000,
      typicalMaxInr: 400_000,
      serviceAreas: [],
      servingRegions: null,
      deliverySlots: 0,
      capabilityChips: [],
      projectTypes: ["solar"],
    });
    assert.ok(fit.clarify.length > 0);
    assert.equal(fit.cards.find((card) => card.id === "budget")?.level, "clarify");
  });
});
