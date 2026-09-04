import { redirect } from "next/navigation";
import { InsightsView } from "@/features/insights/insights-view";
import { getAuthContext } from "@/lib/data/query";
import {
  countOrganisationViews,
  countProfileViews,
  countUniqueProfileViews,
  listFollowers,
  listJobApplications,
  listMyJobApplications,
  listOwnedOrganisations,
  listSearchAppearances,
} from "@/lib/data/workspace";
import { listConnections, listOrgJobs } from "@/lib/data/network";
import { listPublicCertifications, listOptedInProjects, listProfileSkills, listRecommendations } from "@/lib/data/profile";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";

export default async function InsightsPage() {
  const session = await getAuthContext();
  if (!session.userId || !session.profile) redirect("/auth/sign-in?next=/insights");
  const [views, uniqueViews, connections, followers, sent, skills, certs, recs, projects, orgs, appearances] =
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
      listOwnedOrganisations(session.userId),
      listSearchAppearances(session.userId),
    ]);
  let received = 0;
  let orgViews = 0;
  for (const org of orgs.data) {
    const jobs = await listOrgJobs(org.id);
    for (const job of jobs.data) {
      const apps = await listJobApplications(job.id);
      received += apps.data.length;
    }
    const viewsForOrg = await countOrganisationViews(org.id);
    orgViews += viewsForOrg.data ?? 0;
  }
  const passport = calculatePassportStrength({
    identityVerified: session.profile.identityVerified,
    employmentVerified: session.profile.employmentVerified,
    skillCount: skills.data.length,
    publicCredentialCount: certs.data.length,
    projectCount: projects.data.length,
    recommendationCount: recs.data.length,
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
        passport={passport}
        organisations={orgs.data}
      />
    </div>
  );
}
