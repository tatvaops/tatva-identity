import type { ProfileCertification, VerificationState } from "@/lib/types/identity";

export const CREDENTIAL_CATEGORIES = [
  { id: "certification", label: "Certification" },
  { id: "licence", label: "Licence" },
  { id: "training", label: "Training" },
  { id: "safety", label: "Safety certification" },
  { id: "professional_qualification", label: "Professional qualification" },
] as const;

export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number]["id"];

export const CREDENTIAL_STATE_LABEL: Record<VerificationState, string> = {
  verified: "Verified",
  pending: "Pending",
  expired: "Expired",
  revoked: "Revoked",
  not_submitted: "Not submitted",
  self_declared: "Self declared",
};

export function credentialCategoryLabel(category: string): string {
  return CREDENTIAL_CATEGORIES.find((item) => item.id === category)?.label ?? "Credential";
}

export function isCredentialInactive(cert: ProfileCertification): boolean {
  if (cert.verificationState === "expired" || cert.verificationState === "revoked") return true;
  if (!cert.expiryDate) return false;
  return new Date(cert.expiryDate).getTime() < Date.now();
}

export function publicCredentialState(cert: ProfileCertification): VerificationState {
  if (cert.verificationState === "revoked") return "revoked";
  if (isCredentialInactive(cert)) return "expired";
  return cert.verificationState;
}
