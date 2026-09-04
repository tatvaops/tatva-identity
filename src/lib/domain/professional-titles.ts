import type { ProfessionalTitle } from "@/lib/types/identity";

export const PROFESSIONAL_TITLES: { id: ProfessionalTitle; label: string }[] = [
  { id: "white_collar", label: "White collar" },
  { id: "blue_collar", label: "Blue collar" },
  { id: "skilled_trade", label: "Skilled trade" },
  { id: "gig_worker", label: "Gig worker" },
  { id: "freelancer", label: "Freelancer" },
  { id: "contractor", label: "Contractor" },
  { id: "technician", label: "Technician" },
  { id: "supervisor", label: "Supervisor" },
  { id: "engineer", label: "Engineer" },
  { id: "architect", label: "Architect" },
  { id: "designer", label: "Designer" },
  { id: "service_professional", label: "Service professional" },
];

export function professionalTitleLabel(id: ProfessionalTitle | null | undefined) {
  return PROFESSIONAL_TITLES.find((item) => item.id === id)?.label ?? null;
}
