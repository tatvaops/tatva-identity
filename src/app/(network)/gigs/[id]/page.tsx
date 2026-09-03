import { notFound } from "next/navigation";
import { GigDetail } from "@/features/jobs/job-gig-detail";
import { getGig, getOrganisationById } from "@/lib/data/network";
import { isSaved } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = await getGig(id);
  if (gig.meta.error) return <QueryNotice configured={gig.meta.configured} error={gig.meta.error} />;
  if (!gig.data) {
    if (!gig.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const org = await getOrganisationById(gig.data.organisationId);
  const saved = session.userId ? await isSaved(session.userId, "gig", gig.data.id) : false;
  return (
    <GigDetail
      gig={gig.data}
      organisation={org.data}
      saved={saved}
      canManage={Boolean(session.userId && org.data?.createdBy === session.userId)}
    />
  );
}
