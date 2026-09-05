export type AiReviewSource = "google_reviews" | "vantage_forum";

export type AiReviewRecord = {
  sourceKind: AiReviewSource;
  sourceLabel: string;
  overallSentimentPct: number | null;
  strengths: string[];
  concerns: string[];
  themes: string[];
  brandResponseRate: number | null;
  sourceCount: number;
  dateRangeLabel: string | null;
  confidenceLabel: string;
  summary: string;
  sourceHref: string | null;
  generatedAt: string;
};

export function aiReviewSourceLabel(source: AiReviewSource) {
  return source === "google_reviews" ? "Source: Google Reviews" : "Source: Vantage Forum discussions";
}

export function presentAiReview(
  record: AiReviewRecord | null,
  settings: { source: AiReviewSource; enabled: boolean; minimumSourceCount: number },
): { state: "ready" | "disabled" | "low_evidence"; review: AiReviewRecord | null; sourceLabel: string } {
  const sourceLabel = aiReviewSourceLabel(settings.source);
  if (!settings.enabled) return { state: "disabled", review: null, sourceLabel };
  if (!record || record.sourceKind !== settings.source || record.sourceCount < settings.minimumSourceCount) {
    return { state: "low_evidence", review: record, sourceLabel };
  }
  return { state: "ready", review: record, sourceLabel };
}
