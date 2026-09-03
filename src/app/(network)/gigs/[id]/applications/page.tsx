import { notFound, redirect } from "next/navigation";
import { ApplicationsView } from "@/features/jobs/applications-view";
import { getGig, getOrganisationById } from "@/lib/data/network";
import { listGigApplications } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function GigApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthContext();
  const { id } = await params;
  if (!session.userId) redirect(`/auth/sign-in?next=/gigs/${id}/applications`);
  const gig = await getGig(id);
  if (gig.meta.error) return <QueryNotice configured={gig.meta.configured} error={gig.meta.error} />;
  if (!gig.data) notFound();
  const org = await getOrganisationById(gig.data.organisationId);
  if (org.data?.createdBy !== session.userId) redirect(`/gigs/${id}`);
  const applications = await listGigApplications(id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Applications · {gig.data.title}</h1>
      <ApplicationsView kind="gig" applications={applications.data} />
    </div>
  );
}
