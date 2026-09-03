export type ProfileMetric = {
  id: string;
  label: string;
  value: string;
};

export function profileMetrics(input: {
  projectCount: number;
  skillCount: number;
  recommendationCount: number;
  verifiedShiftTotal: number | null;
  rating: number | null;
}): ProfileMetric[] {
  const metrics: ProfileMetric[] = [];
  if (input.projectCount > 0) {
    metrics.push({ id: "projects", label: "Projects", value: String(input.projectCount) });
  }
  if (input.skillCount > 0) {
    metrics.push({ id: "skills", label: "Skills", value: String(input.skillCount) });
  }
  if (input.recommendationCount > 0) {
    metrics.push({
      id: "recommendations",
      label: "Recommendations",
      value: String(input.recommendationCount),
    });
  }
  if (input.verifiedShiftTotal != null && input.verifiedShiftTotal > 0) {
    metrics.push({
      id: "shifts",
      label: "Verified shifts",
      value: String(input.verifiedShiftTotal),
    });
  }
  if (input.rating != null) {
    metrics.push({ id: "rating", label: "Rating", value: input.rating.toFixed(2) });
  }
  return metrics;
}
