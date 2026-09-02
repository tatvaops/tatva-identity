import { notFound } from "next/navigation";
import { GigDetail } from "@/features/jobs/job-gig-detail";
import { getGig, getOrganisationById } from "@/lib/data/network";
import { QueryNotice } from "@/components/states/empty-state";

export default async function GigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = await getGig(id);
  if (gig.meta.error) return <QueryNotice configured={gig.meta.configured} error={gig.meta.error} />;
  if (!gig.data) {
    if (!gig.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const org = await getOrganisationById(gig.data.organisationId);
  return <GigDetail gig={gig.data} organisation={org.data} />;
}
