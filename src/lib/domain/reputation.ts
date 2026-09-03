import type { NetworkProject, ProfileCertification, PublicProfile, RecommendationRow } from "@/lib/types/identity";

export type ReputationSignal = {
  id: string;
  label: string;
  source: string;
};

export function reputationSignals(input: {
  profile: PublicProfile;
  recommendations: RecommendationRow[];
  certifications: ProfileCertification[];
  projects: NetworkProject[];
}): ReputationSignal[] {
  const verifiedCredentials = input.certifications.filter((item) => item.verificationState === "verified").length;
  const verifiedProjects = input.projects.filter((item) => item.verified).length;
  return [
    input.profile.identityVerified
      ? { id: "identity", label: "Identity verified", source: "Passport check" }
      : null,
    input.profile.employmentVerified
      ? { id: "employment", label: "Employment verified", source: "Organisation or Vertex record" }
      : null,
    input.profile.tradeVerified ? { id: "trade", label: "Trade verified", source: "Trade check" } : null,
    input.recommendations.length > 0
      ? {
          id: "recommendations",
          label: `${input.recommendations.length} recommendation${input.recommendations.length === 1 ? "" : "s"}`,
          source: "People who have worked with them",
        }
      : null,
    verifiedCredentials > 0
      ? {
          id: "credentials",
          label: `${verifiedCredentials} verified credential${verifiedCredentials === 1 ? "" : "s"}`,
          source: "Public credential wallet",
        }
      : null,
    verifiedProjects > 0
      ? {
          id: "projects",
          label: `${verifiedProjects} verified project${verifiedProjects === 1 ? "" : "s"}`,
          source: "Opted-in project record",
        }
      : null,
  ].filter((row): row is ReputationSignal => row !== null);
}
