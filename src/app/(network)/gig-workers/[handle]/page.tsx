import { notFound, redirect } from "next/navigation";
import { GigWorkerView } from "@/features/identiti/gig-worker-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getProfileByHandle } from "@/lib/data/profile";
import { listPortfolio, listSkillFacts, listSupervisorReviews, recordIdentitiEvent } from "@/lib/data/identiti";
import { personPublicHref } from "@/lib/domain/identiti-routes";

export default async function GigWorkerPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  if (profile.data.occupationMode === "white_collar") {
    redirect(personPublicHref(profile.data.handle, profile.data.occupationMode));
  }
  const [portfolio, reviews, facts] = await Promise.all([
    listPortfolio(profile.data.id),
    listSupervisorReviews(profile.data.id),
    listSkillFacts(profile.data.id),
  ]);
  await recordIdentitiEvent("gig_worker_profile_view", "profile", profile.data.id);
  return <GigWorkerView profile={profile.data} portfolio={portfolio} reviews={reviews} facts={facts} />;
}
