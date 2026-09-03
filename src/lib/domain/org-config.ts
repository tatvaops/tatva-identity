import type { OrganisationType, VerificationState } from "@/lib/types/identity";

export type BusinessCredentialCategory = {
  id: string;
  label: string;
  explanation: string;
};

export const BUSINESS_CREDENTIAL_CATEGORIES: BusinessCredentialCategory[] = [
  { id: "registration", label: "Business registration", explanation: "Company or firm registration on public record." },
  { id: "gst", label: "GST", explanation: "GST registration state. Document numbers stay private." },
  { id: "pan", label: "PAN", explanation: "PAN verification state. The number is never shown." },
  { id: "office_address", label: "Office address", explanation: "Workplace address check. Home addresses are never used." },
  { id: "bank", label: "Bank verification", explanation: "Bank confirmation state only. Account details stay private." },
  { id: "insurance", label: "Insurance", explanation: "Coverage confirmation without policy documents." },
  { id: "trade_licence", label: "Trade licence", explanation: "Trade licence status when submitted." },
  { id: "clra", label: "CLRA", explanation: "Labour compliance state. Files stay private." },
  { id: "pf", label: "PF", explanation: "PF compliance state. Contribution data is never public." },
  { id: "esi", label: "ESI", explanation: "ESI compliance state. Medical and payroll data stay private." },
  { id: "professional", label: "Professional certifications", explanation: "Public certifications held by the organisation." },
];

export function organisationTypeLabel(type: OrganisationType): string {
  return type.replaceAll("_", " ");
}

export function credentialStateLabel(state: VerificationState | "not_submitted"): string {
  return state.replaceAll("_", " ");
}
