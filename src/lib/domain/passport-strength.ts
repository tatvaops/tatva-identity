import type { PublicProfile } from "@/lib/types/identity";

export type PassportItemStatus = "verified" | "present" | "not_provided";

export type PassportComponent = {
  id: string;
  label: string;
  complete: boolean;
  status: PassportItemStatus;
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
  hasName?: boolean;
  hasPhoto?: boolean;
  hasHeadline?: boolean;
  hasLocation?: boolean;
  experienceCount?: number;
  educationCount?: number;
}): PassportStrength {
  const item = (complete: boolean, verified: boolean): PassportItemStatus =>
    verified ? "verified" : complete ? "present" : "not_provided";
  const named = input.hasName !== false;
  const photo = Boolean(input.hasPhoto);
  const headline = Boolean(input.hasHeadline);
  const location = Boolean(input.hasLocation);
  const experienceCount = input.experienceCount ?? 0;
  const educationCount = input.educationCount ?? 0;
  const components: PassportComponent[] = [
    {
      id: "identity",
      label: "Identity",
      complete: named && photo,
      status: item(named && photo, input.identityVerified),
      detail: input.identityVerified ? "Verified" : named && photo ? "Name and photograph present" : "Add a name and photograph",
    },
    {
      id: "headline",
      label: "Headline",
      complete: headline,
      status: item(headline, false),
      detail: headline ? "Present" : "Add what you do",
    },
    {
      id: "location",
      label: "Location",
      complete: location,
      status: item(location, false),
      detail: location ? "Present" : "Add a work city",
    },
    {
      id: "employment",
      label: "Experience",
      complete: experienceCount > 0 || input.employmentVerified,
      status: item(experienceCount > 0, input.employmentVerified),
      detail: input.employmentVerified
        ? "Employer confirmed"
        : experienceCount > 0
          ? `${experienceCount} role${experienceCount === 1 ? "" : "s"}`
          : "Not provided",
    },
    {
      id: "skills",
      label: "Skills",
      complete: input.skillCount > 0,
      status: item(input.skillCount > 0, false),
      detail: input.skillCount > 0 ? `${input.skillCount} listed` : "Not provided",
    },
    {
      id: "projects",
      label: "Projects",
      complete: input.projectCount > 0,
      status: item(input.projectCount > 0, false),
      detail: input.projectCount > 0 ? `${input.projectCount} opted-in` : "Not provided",
    },
    {
      id: "credentials",
      label: "Credentials",
      complete: input.publicCredentialCount > 0,
      status: item(input.publicCredentialCount > 0, false),
      detail: input.publicCredentialCount > 0 ? `${input.publicCredentialCount} public` : "Not provided",
    },
    {
      id: "education",
      label: "Education / training",
      complete: educationCount > 0,
      status: item(educationCount > 0, false),
      detail: educationCount > 0 ? `${educationCount} record${educationCount === 1 ? "" : "s"}` : "Optional",
    },
    {
      id: "references",
      label: "References",
      complete: input.recommendationCount >= 1,
      status: item(input.recommendationCount > 0, false),
      detail: input.recommendationCount > 0 ? `${input.recommendationCount}` : "Not provided",
    },
  ];
  const scored = components.filter((c) => c.id !== "education" && c.id !== "references");
  const completeness = Math.round((scored.filter((c) => c.complete).length / scored.length) * 100);
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
