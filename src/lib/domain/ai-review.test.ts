import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { presentAiReview, type AiReviewRecord } from "./ai-review";

const review = (over: Partial<AiReviewRecord> = {}): AiReviewRecord => ({
  sourceKind: "vantage_forum",
  sourceLabel: "Source: Vantage Forum discussions",
  overallSentimentPct: 81,
  strengths: ["Site presence"],
  concerns: ["Lead time"],
  themes: ["Handover"],
  brandResponseRate: 0.7,
  sourceCount: 12,
  dateRangeLabel: "2026",
  confidenceLabel: "medium",
  summary: "Demonstration pulse",
  sourceHref: "/forums",
  generatedAt: "2026-09-05T00:00:00.000Z",
  ...over,
});

describe("AI review presentation", () => {
  it("labels the configured source", () => {
    const ready = presentAiReview(review(), { source: "vantage_forum", enabled: true, minimumSourceCount: 5 });
    assert.equal(ready.state, "ready");
    assert.match(ready.sourceLabel, /Vantage Forum/);
  });

  it("stays low-evidence below the threshold instead of inventing a summary", () => {
    const low = presentAiReview(review({ sourceKind: "google_reviews", sourceCount: 2 }), {
      source: "google_reviews",
      enabled: true,
      minimumSourceCount: 5,
    });
    assert.equal(low.state, "low_evidence");
    assert.match(low.sourceLabel, /Google Reviews/);
  });
});
