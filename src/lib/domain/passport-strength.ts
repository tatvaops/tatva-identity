import type { PublicProfile } from "@/lib/types/identity";

export type PassportComponent = {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
};

export type PassportStrength = {
  completeness: number;
  components: PassportComponent[];
};

export function calculatePassportStrength(input: {
  identityVerified: boolean;
  employmentVerified: boolean;
  skillCount: number;
  publicCredentialCount: number;
  projectCount: number;
  recommendationCount: number;
}): PassportStrength {
  const components: PassportComponent[] = [
    {
      id: "identity",
      label: "Identity",
      complete: input.identityVerified,
      detail: input.identityVerified ? "Verified" : "Not verified yet",
    },
    {
      id: "employment",
      label: "Employment",
      complete: input.employmentVerified,
      detail: input.employmentVerified ? "Verified" : "Not verified yet",
    },
    {
      id: "skills",
      label: "Skills",
      complete: input.skillCount > 0,
      detail: input.skillCount > 0 ? `${input.skillCount} on profile` : "None added",
    },
    {
      id: "credentials",
      label: "Credentials",
      complete: input.publicCredentialCount > 0,
      detail: input.publicCredentialCount > 0 ? `${input.publicCredentialCount} public` : "None public",
    },
    {
      id: "projects",
      label: "Project history",
      complete: input.projectCount > 0,
      detail: input.projectCount > 0 ? `${input.projectCount} opted-in` : "None yet",
    },
    {
      id: "references",
      label: "References",
      complete: input.recommendationCount >= 1,
      detail: input.recommendationCount > 0 ? `${input.recommendationCount}` : "None yet",
    },
  ];
  const completeness = Math.round((components.filter((c) => c.complete).length / components.length) * 100);
  return { completeness, components };
}

export function hireLabel(mode: PublicProfile["occupationMode"]): string {
  return mode === "white_collar" ? "Recruit / Offer job" : "Hire / Offer work";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * 17) % 360;
  return h;
}
