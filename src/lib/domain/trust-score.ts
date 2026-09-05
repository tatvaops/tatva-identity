export type TrustEvidence = {
  gstVerified: boolean;
  kycVerified: boolean;
  verifiedProjects: number;
  verifiedReviews: number;
  hasQcNotes: boolean;
  onTimePct: number | null;
  qualityRating: number | null;
};

export type TrustBreakdown = {
  label: string;
  ok: boolean;
};

export type TrustScore = {
  score: number | null;
  label: string;
  breakdown: TrustBreakdown[];
  insufficient: boolean;
};

export function calculateTrustScore(input: TrustEvidence, minReviews = 2): TrustScore {
  const breakdown: TrustBreakdown[] = [
    { label: "KYC & GST verified", ok: input.gstVerified && input.kycVerified },
    { label: `${input.verifiedProjects} project calls checked`, ok: input.verifiedProjects > 0 },
    { label: "QC records available", ok: input.hasQcNotes },
    { label: `${input.verifiedReviews} verified reviews`, ok: input.verifiedReviews >= minReviews },
  ];
  const checks = breakdown.filter((row) => row.ok).length;
  if (input.verifiedReviews < minReviews && input.verifiedProjects === 0) {
    return { score: null, label: "Insufficient evidence", breakdown, insufficient: true };
  }
  let score = 55 + checks * 8;
  if (input.onTimePct != null) score += Math.min(10, input.onTimePct / 10);
  if (input.qualityRating != null) score += input.qualityRating * 2;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, label: `${score}/100`, breakdown, insufficient: false };
}
