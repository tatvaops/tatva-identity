export type EvidenceTrustId = "claimed" | "evidence_backed" | "verified";

export type EvidenceTrust = {
  id: EvidenceTrustId;
  label: string;
  detail: string;
};

export function evidenceTrustLabel(input: {
  verificationState?: string | null;
  hasMedia?: boolean;
  hasDocument?: boolean;
  operatorVerified?: boolean;
}): EvidenceTrust {
  if (input.operatorVerified || input.verificationState === "verified") {
    return {
      id: "verified",
      label: "Verified",
      detail: "An operator or issuing organisation confirmed this.",
    };
  }
  if (input.verificationState === "evidence_backed" || input.hasMedia || input.hasDocument) {
    return {
      id: "evidence_backed",
      label: "Evidence-backed",
      detail: "Supporting media or a document is attached. It is not independently verified.",
    };
  }
  return {
    id: "claimed",
    label: "Claimed",
    detail: "Self-declared. No supporting file is attached yet.",
  };
}
