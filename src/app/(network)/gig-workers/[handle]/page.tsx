import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { GigWorkerView } from "@/features/identiti/gig-worker-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getProfileByHandle } from "@/lib/data/profile";
import { listPortfolio, listSkillFacts, listSupervisorReviews, recordIdentitiEvent } from "@/lib/data/identiti";
import { getConnectionState, isFollowing, listExperiences, listPostsByAuthor, listProfileSkills, listRecommendations } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";
import { viewerIsRecruiter } from "@/lib/data/privacy";
import { applyProfilePrivacy, showActivity, showExperience, viewerFromNetwork } from "@/lib/domain/visibility";
import { isSaved, isPersonBlocked, listProfileServices, recordProfileView } from "@/lib/data/workspace";
import { isGigOccupation, personPublicHref } from "@/lib/domain/identiti-routes";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile.data) return { title: "Gig worker" };
  return entityMetadata({
    title: profile.data.fullName,
    description: profile.data.headline ?? profile.data.about,
    path: personPublicHref(profile.data.handle, profile.data.occupationMode),
    image: profile.data.avatarPath,
  });
}

export default async function GigWorkerPage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  if (!isGigOccupation(profile.data.occupationMode)) {
    redirect(personPublicHref(profile.data.handle, profile.data.occupationMode));
  }
  const session = await getAuthContext();
  const [portfolio, reviews, facts, experiences, posts, skills, services, recommendations, connectionState, following, saved, blocked] = await Promise.all([
    listPortfolio(profile.data.id),
    listSupervisorReviews(profile.data.id),
    listSkillFacts(profile.data.id),
    listExperiences(profile.data.id),
    listPostsByAuthor(profile.data.id),
    listProfileSkills(profile.data.id),
    listProfileServices(profile.data.id),
    listRecommendations(profile.data.id),
    session.userId ? getConnectionState(session.userId, profile.data.id) : Promise.resolve("connect" as const),
    session.userId ? isFollowing(session.userId, { personId: profile.data.id }) : Promise.resolve(false),
    session.userId ? isSaved(session.userId, "profile", profile.data.id) : Promise.resolve(false),
    session.userId ? isPersonBlocked(session.userId, profile.data.id) : Promise.resolve(false),
  ]);
  await recordIdentitiEvent("gig_worker_profile_view", "profile", profile.data.id);
  await recordProfileView(profile.data.id, session.userId);
  const isOwner = session.userId === profile.data.id;
  const isRecruiter = session.userId ? await viewerIsRecruiter() : false;
  const relation = viewerFromNetwork({ isOwner, connectionState, isRecruiter });
  return (
    <GigWorkerView
      profile={applyProfilePrivacy(profile.data, relation)}
      portfolio={portfolio}
      reviews={reviews}
      facts={facts}
      experiences={showExperience(profile.data, relation) ? experiences.data : []}
      posts={showActivity(profile.data, relation) ? posts.data : []}
      skills={skills.data}
      services={services.data}
      recommendations={recommendations.data}
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
