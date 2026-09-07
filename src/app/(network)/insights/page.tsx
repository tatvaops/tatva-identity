import { redirect } from "next/navigation";
import { InsightsView } from "@/features/insights/insights-view";
import { getAuthContext } from "@/lib/data/query";
import {
  countOrganisationViewsForIds,
  countProfileViews,
  countProjectViewsForProfile,
  countReceivedApplicationsForOrganisations,
  countUniqueProfileViews,
  listFollowers,
  listMyJobApplications,
  listOwnedOrganisations,
  listSearchAppearances,
} from "@/lib/data/workspace";
import { listConnections } from "@/lib/data/network";
import { listExperiences, listPublicCertifications, listOptedInProjects, listProfileSkills, listRecommendations } from "@/lib/data/profile";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";

export default async function InsightsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/insights");
  if (!session.profile) redirect("/onboarding");
  const [views, uniqueViews, connections, followers, sent, skills, certs, recs, projects, experiences, orgs, appearances, projectViews] =
    await Promise.all([
      countProfileViews(session.userId),
      countUniqueProfileViews(session.userId),
      listConnections(session.userId),
      listFollowers(session.userId),
      listMyJobApplications(session.userId),
      listProfileSkills(session.userId),
      listPublicCertifications(session.userId),
      listRecommendations(session.userId),
      listOptedInProjects(session.userId),
      listExperiences(session.userId),
      listOwnedOrganisations(session.userId),
      listSearchAppearances(session.userId),
      countProjectViewsForProfile(session.userId),
    ]);
  const orgIds = orgs.data.map((org) => org.id);
  const [received, orgViews] = await Promise.all([
    countReceivedApplicationsForOrganisations(orgIds),
    countOrganisationViewsForIds(orgIds),
  ]);
  const passport = calculatePassportStrength({
    identityVerified: session.profile.identityVerified,
    employmentVerified: session.profile.employmentVerified,
    skillCount: skills.data.length,
    publicCredentialCount: certs.data.length,
    projectCount: projects.data.length,
    recommendationCount: recs.data.length,
    hasName: Boolean(session.profile.fullName.trim() && session.profile.fullName !== "New professional"),
    hasPhoto: Boolean(session.profile.avatarPath),
    hasHeadline: Boolean(session.profile.headline),
    hasLocation: Boolean(session.profile.city),
    experienceCount: experiences.data.length,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Insights</h1>
      <p className="text-sm text-muted-foreground">Counts come from real events only. Nothing is estimated.</p>
      <InsightsView
        viewCount={views.data ?? 0}
        uniqueViewers={uniqueViews.data ?? 0}
        connectionCount={connections.data.length}
        followerCount={followers.data.length}
        applicationCount={sent.data.length}
        receivedCount={received}
        orgViewCount={orgViews}
        searchAppearanceCount={appearances.data.length}
        projectViewCount={projectViews}
        passport={passport}
        organisations={orgs.data}
      />
    </div>
  );
}
