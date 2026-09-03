import type { NetworkProject, OrgService } from "@/lib/types/identity";

export type OrganisationMetric = {
  id: string;
  label: string;
  value: string;
};

export function organisationMetrics(input: {
  peopleCount: number;
  projects: NetworkProject[];
  services: OrgService[];
  reviewCount: number;
  foundedYear: number | null;
}): OrganisationMetric[] {
  const completed = input.projects.filter((project) => project.status === "completed").length;
  const verified = input.projects.filter((project) => project.verified).length;
  const locations = new Set(input.services.flatMap((service) => service.locations));
  const years = input.foundedYear ? new Date().getFullYear() - input.foundedYear : 0;
  return [
    completed > 0 ? { id: "completed", label: "Completed projects", value: String(completed) } : null,
    verified > 0 ? { id: "verified", label: "Verified projects", value: String(verified) } : null,
    input.peopleCount > 0 ? { id: "team", label: "Team", value: String(input.peopleCount) } : null,
    years > 0 ? { id: "years", label: "Years active", value: String(years) } : null,
    input.reviewCount > 0 ? { id: "reviews", label: "Reviews", value: String(input.reviewCount) } : null,
    locations.size > 0 ? { id: "locations", label: "Service locations", value: String(locations.size) } : null,
  ].filter((row): row is OrganisationMetric => row !== null);
}
