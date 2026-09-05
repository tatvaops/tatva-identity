export const REQUIREMENT_OPTIONS = [
  { id: "premium_interiors", label: "Premium interiors" },
  { id: "full_home_renovation", label: "Full-home renovation" },
  { id: "villa_construction", label: "Villa construction" },
  { id: "budget_interiors", label: "Budget interiors" },
  { id: "commercial_interiors", label: "Commercial interiors" },
  { id: "solar_installation", label: "Solar installation" },
] as const;

export type RequirementId = (typeof REQUIREMENT_OPTIONS)[number]["id"];
export type FitLevel = "strong" | "good" | "clarify";

export type RequirementFitInput = {
  designCapability: boolean;
  executionCapability: boolean;
  typicalMinInr: number | null;
  typicalMaxInr: number | null;
  serviceAreas: string[];
  servingRegions: string | null;
  deliverySlots: number | null;
  capabilityChips: string[];
  projectTypes: string[];
};

export type FitCard = {
  id: string;
  label: string;
  level: FitLevel;
  reason: string;
};

export type RequirementFit = {
  requirement: RequirementId;
  overall: FitLevel;
  cards: FitCard[];
  relevantProjectTypes: string[];
  clarify: string[];
};

const BUDGETS: Record<RequirementId, { min: number; max: number }> = {
  premium_interiors: { min: 1_500_000, max: 25_000_000 },
  full_home_renovation: { min: 800_000, max: 12_000_000 },
  villa_construction: { min: 8_000_000, max: 40_000_000 },
  budget_interiors: { min: 200_000, max: 1_800_000 },
  commercial_interiors: { min: 2_000_000, max: 30_000_000 },
  solar_installation: { min: 150_000, max: 4_000_000 },
};

function overlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return aMin <= bMax && bMin <= aMax;
}

function levelFrom(score: number): FitLevel {
  if (score >= 2) return "strong";
  if (score >= 1) return "good";
  return "clarify";
}

export function calculateRequirementFit(requirement: RequirementId, input: RequirementFitInput): RequirementFit {
  const budget = BUDGETS[requirement];
  const wantsDesign = requirement !== "solar_installation";
  const designScore = input.designCapability || input.capabilityChips.some((chip) => /design|interior/i.test(chip)) ? 2 : wantsDesign ? 0 : 1;
  const complexityScore =
    input.executionCapability || input.projectTypes.some((type) => /villa|renovation|turnkey|construction/i.test(type))
      ? 2
      : 1;
  const hasRange = input.typicalMinInr != null && input.typicalMaxInr != null;
  const budgetScore = hasRange && overlap(input.typicalMinInr!, input.typicalMaxInr!, budget.min, budget.max) ? 2 : hasRange ? 0 : 1;
  const locationScore = input.serviceAreas.length > 0 || input.servingRegions ? 2 : 0;
  const capacityScore = (input.deliverySlots ?? 0) > 0 ? 2 : 1;

  const cards: FitCard[] = [
    {
      id: "design",
      label: "Design & finish",
      level: levelFrom(designScore),
      reason: designScore >= 2 ? "Strongest-rated capability" : "Ask whether design is in-house or partnered",
    },
    {
      id: "complexity",
      label: "Project complexity",
      level: levelFrom(complexityScore),
      reason: complexityScore >= 2 ? "In-house design + execution partners" : "Confirm who owns site execution",
    },
    {
      id: "budget",
      label: "Budget alignment",
      level: levelFrom(budgetScore),
      reason: budgetScore >= 2 ? "Within their usual project band" : "Clarify if this sits outside their usual range",
    },
    {
      id: "location",
      label: "Location availability",
      level: levelFrom(locationScore),
      reason: locationScore >= 2 ? input.servingRegions || input.serviceAreas.join(", ") : "Confirm they serve your city",
    },
    {
      id: "capacity",
      label: "Delivery capacity",
      level: levelFrom(capacityScore),
      reason: capacityScore >= 2 ? `${input.deliverySlots} open slot(s)` : "Ask current start date",
    },
  ];

  const scores = [designScore, complexityScore, budgetScore, locationScore, capacityScore];
  const overall = levelFrom(Math.round(scores.reduce((sum, n) => sum + n, 0) / scores.length));
  const relevant = input.projectTypes.filter((type) => {
    if (requirement === "villa_construction") return /villa|construction/i.test(type);
    if (requirement.includes("interior")) return /interior|turnkey/i.test(type);
    if (requirement === "solar_installation") return /solar/i.test(type);
    return true;
  });

  return {
    requirement,
    overall,
    cards,
    relevantProjectTypes: relevant,
    clarify: cards.filter((card) => card.level === "clarify").map((card) => card.reason),
  };
}
