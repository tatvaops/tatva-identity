import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfessionalView } from "@/features/identiti/professional-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getProfileByHandle } from "@/lib/data/profile";
import { getIdentitiBrandById, listIdentitiProjectsForProfile, recordIdentitiEvent } from "@/lib/data/identiti";
import { getConnectionState, isFollowing, listExperiences, listPostsByAuthor, listProfileSkills, listPublicCertifications, listRecommendations } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";
import { viewerIsRecruiter } from "@/lib/data/privacy";
import { applyProfilePrivacy, showActivity, showExperience, showProjects, viewerFromNetwork } from "@/lib/domain/visibility";
import { isSaved, isPersonBlocked, listEducation, listProfileServices, recordProfileView } from "@/lib/data/workspace";
import { isGigOccupation, personPublicHref } from "@/lib/domain/identiti-routes";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile.data) return { title: "Professional" };
  return entityMetadata({
    title: profile.data.fullName,
    description: profile.data.headline ?? profile.data.about,
    path: personPublicHref(profile.data.handle, profile.data.occupationMode),
    image: profile.data.avatarPath,
  });
}

export default async function ProfessionalPage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  if (isGigOccupation(profile.data.occupationMode)) {
    redirect(personPublicHref(profile.data.handle, profile.data.occupationMode));
  }
  const session = await getAuthContext();
  const [projects, employer, experiences, certifications, recommendations, posts, skills, services, education, connectionState, following, saved, blocked] =
    await Promise.all([
      listIdentitiProjectsForProfile(profile.data.id),
      profile.data.currentOrganisationId ? getIdentitiBrandById(profile.data.currentOrganisationId) : Promise.resolve(null),
      listExperiences(profile.data.id),
      listPublicCertifications(profile.data.id),
      listRecommendations(profile.data.id),
      listPostsByAuthor(profile.data.id),
      listProfileSkills(profile.data.id),
      listProfileServices(profile.data.id),
      listEducation(profile.data.id),
      session.userId ? getConnectionState(session.userId, profile.data.id) : Promise.resolve("connect" as const),
      session.userId ? isFollowing(session.userId, { personId: profile.data.id }) : Promise.resolve(false),
      session.userId ? isSaved(session.userId, "profile", profile.data.id) : Promise.resolve(false),
      session.userId ? isPersonBlocked(session.userId, profile.data.id) : Promise.resolve(false),
    ]);
  await recordIdentitiEvent("professional_profile_view", "profile", profile.data.id);
  await recordProfileView(profile.data.id, session.userId);
  const isOwner = session.userId === profile.data.id;
  const isRecruiter = session.userId ? await viewerIsRecruiter() : false;
  const relation = viewerFromNetwork({ isOwner, connectionState, isRecruiter });
  return (
    <ProfessionalView
      profile={applyProfilePrivacy(profile.data, relation)}
      projects={showProjects(profile.data, relation) ? projects : []}
      employer={employer}
      experiences={showExperience(profile.data, relation) ? experiences.data : []}
      certifications={certifications.data}
      recommendations={recommendations.data}
      posts={showActivity(profile.data, relation) ? posts.data : []}
      skills={skills.data}
      services={services.data}
      education={education.data}
      connectionState={connectionState}
      following={following}
      signedIn={Boolean(session.userId)}
      isOwner={isOwner}
      isRecruiter={isRecruiter}
      saved={saved}
      blocked={blocked}
    />
  );
}
