import type { PublicProfile } from "@/lib/types/identity";

export function relevanceScore(viewer: PublicProfile, candidate: PublicProfile, signals: {
  sharedSkillCount: number;
  mutualConnectionCount: number;
  sharedOrganisation: boolean;
}) {
  let score = 0;
  if (viewer.city && candidate.city && viewer.city.toLowerCase() === candidate.city.toLowerCase()) score += 3;
  if (viewer.occupationMode === candidate.occupationMode) score += 2;
  if (viewer.availabilityStatus !== "not_looking" && candidate.availabilityStatus !== "not_looking") score += 1;
  score += Math.min(4, signals.sharedSkillCount * 2);
  score += Math.min(3, signals.mutualConnectionCount);
  if (signals.sharedOrganisation) score += 3;
  const viewerIndustries = new Set(viewer.industriesServed.map((item) => item.toLowerCase()));
  if (candidate.industriesServed.some((item) => viewerIndustries.has(item.toLowerCase()))) score += 2;
  return score;
}

export function rankSuggestions<T extends { score: number }>(rows: T[], limit = 8) {
  return [...rows].sort((a, b) => b.score - a.score).slice(0, limit);
}
