import type { OccupationMode } from "@/lib/types/identity";

export type ProfileSectionId =
  | "about"
  | "passport"
  | "experience"
  | "verifiedHistory"
  | "projects"
  | "skills"
  | "credentials"
  | "recommendations"
  | "posts"
  | "services"
  | "availability";

export type ProfessionalProfileConfig = {
  mode: OccupationMode;
  titleFallback: string;
  hireLabel: string;
  sections: ProfileSectionId[];
};

const SHARED: ProfileSectionId[] = [
  "about",
  "passport",
  "experience",
  "verifiedHistory",
  "projects",
  "skills",
  "credentials",
  "recommendations",
  "posts",
];

export function profileConfigFor(mode: OccupationMode): ProfessionalProfileConfig {
  switch (mode) {
    case "blue_collar":
      return {
        mode,
        titleFallback: "Skilled professional",
        hireLabel: "Hire / Offer work",
        sections: SHARED,
      };
    case "freelancer":
      return {
        mode,
        titleFallback: "Independent professional",
        hireLabel: "Hire / Offer work",
        sections: ["about", "passport", "services", "projects", "availability", "experience", "skills", "credentials", "recommendations", "posts"],
      };
    case "contractor":
      return {
        mode,
        titleFallback: "Contract professional",
        hireLabel: "Hire / Offer work",
        sections: SHARED,
      };
    default:
      return {
        mode: "white_collar",
        titleFallback: "Professional",
        hireLabel: "Recruit / Offer job",
        sections: SHARED,
      };
  }
}

export function hasSection(config: ProfessionalProfileConfig, id: ProfileSectionId): boolean {
  return config.sections.includes(id);
}
