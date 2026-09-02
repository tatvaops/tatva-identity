import type { PublicProfile } from "@/lib/types/identity";

export type VerificationFlag = {
  kind: "identity" | "employment" | "trade" | "project" | "skill" | "credential" | "tatva";
  state: "verified" | "pending" | "expired" | "not_submitted" | "self_declared";
  label: string;
  explanation: string;
  verifiedBy?: string;
};

export function flagsFromProfile(profile: PublicProfile): VerificationFlag[] {
  const flags: VerificationFlag[] = [];
  if (profile.identityVerified) {
    flags.push({
      kind: "identity",
      state: "verified",
      label: "Identity Verified",
      explanation: "Identity check completed. Document numbers are never shown on this network.",
    });
  }
  if (profile.employmentVerified) {
    flags.push({
      kind: "employment",
      state: "verified",
      label: "Employment Verified",
      explanation: "An organisation has confirmed an engagement. Payroll details stay private.",
    });
  }
  if (profile.tradeVerified) {
    flags.push({
      kind: "trade",
      state: "verified",
      label: "Trade Verified",
      explanation: "Primary trade is confirmed from verified work, not only a self-declared title.",
    });
  }
  return flags;
}
