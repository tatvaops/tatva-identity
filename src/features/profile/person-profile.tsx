import {
  AboutSection,
  CredentialsSection,
  ExperienceSection,
  IndependentServicesSection,
  PassportSection,
  ProfileHeader,
  ProfileMetricStrip,
  ProfilePosts,
  ProfileSidebar,
  ProjectPortfolio,
  RecommendationsSection,
  ReputationSection,
  SkillsSection,
  VerifiedExperienceSection,
} from "@/features/profile/sections";
import { ProfileActionBar } from "@/features/profile/profile-actions";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import { profileConfigFor, hasSection } from "@/lib/domain/profile-config";
import { profileMetrics } from "@/lib/domain/profile-metrics";
import { reputationSignals } from "@/lib/domain/reputation";
import { flagsFromEvidence } from "@/lib/domain/verification";
import { getVerifiedWorkHistory } from "@/lib/integrations/vertex";
import { getOrganisationById } from "@/lib/data/organisation";
import { getAuthContext } from "@/lib/data/query";
import { getConnectionState, isFollowing } from "@/lib/data/network";
import type {
  Experience,
  NetworkProject,
  Post,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
} from "@/lib/types/identity";

export async function PersonProfileView({
  profile,
  experiences,
  skills,
  certifications,
  recommendations,
  projects,
  posts,
}: {
  profile: PublicProfile;
  experiences: Experience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  recommendations: RecommendationRow[];
  projects: NetworkProject[];
  posts: Post[];
}) {
  const session = await getAuthContext();
  const org = profile.currentOrganisationId ? (await getOrganisationById(profile.currentOrganisationId)).data : null;
  const ledger = await getVerifiedWorkHistory(profile.id);
  const config = profileConfigFor(profile.occupationMode);
  const passport = calculatePassportStrength({
    identityVerified: profile.identityVerified,
    employmentVerified: profile.employmentVerified,
    skillCount: skills.length,
    publicCredentialCount: certifications.length,
    projectCount: projects.length,
    recommendationCount: recommendations.length,
  });
  const flags = flagsFromEvidence({ profile, skills, certifications, projects });
  const metrics = profileMetrics({
    projectCount: projects.length,
    skillCount: skills.length,
    recommendationCount: recommendations.length,
    verifiedShiftTotal: ledger.reduce((sum, row) => sum + (row.verifiedShifts ?? 0), 0) || null,
    rating: null,
  });
  const connectionState =
    session.userId && session.userId !== profile.id
      ? await getConnectionState(session.userId, profile.id)
      : "connect";
  const following =
    session.userId && session.userId !== profile.id
      ? await isFollowing(session.userId, { personId: profile.id })
      : false;
  const isOwner = session.userId === profile.id;
  const signals = reputationSignals({ profile, recommendations, certifications, projects });

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <ProfileHeader
        profile={profile}
        org={org}
        flags={flags}
        connectionState={connectionState}
        following={following}
        hireLabel={config.hireLabel}
        isOwner={isOwner}
        signedIn={Boolean(session.userId)}
      />
      <ProfileMetricStrip metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {hasSection(config, "about") && <AboutSection profile={profile} />}
          <ReputationSection signals={signals} />
          {hasSection(config, "passport") && <PassportSection strength={passport} handle={profile.handle} />}
          {hasSection(config, "services") && <IndependentServicesSection />}
          {hasSection(config, "experience") && <ExperienceSection experiences={experiences} canEdit={isOwner} />}
          {hasSection(config, "verifiedHistory") && <VerifiedExperienceSection rows={ledger} />}
          {hasSection(config, "projects") && <ProjectPortfolio projects={projects} canEdit={isOwner} />}
          {hasSection(config, "skills") && <SkillsSection skills={skills} canEdit={isOwner} />}
          {hasSection(config, "credentials") && (
            <CredentialsSection certifications={certifications} canEdit={isOwner} />
          )}
          {hasSection(config, "recommendations") && (
            <RecommendationsSection
              recommendations={recommendations}
              toProfileId={profile.id}
              canWrite={Boolean(session.userId && !isOwner)}
            />
          )}
          {hasSection(config, "posts") && <ProfilePosts posts={posts} author={profile} />}
        </div>
        <ProfileSidebar profile={profile} org={org} canEdit={isOwner} />
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-white p-3 lg:hidden">
        <ProfileActionBar
          profile={profile}
          connectionState={connectionState}
          following={following}
          hireLabel={config.hireLabel}
          isOwner={isOwner}
          signedIn={Boolean(session.userId)}
          layout="mobile"
        />
      </div>
    </div>
  );
}
