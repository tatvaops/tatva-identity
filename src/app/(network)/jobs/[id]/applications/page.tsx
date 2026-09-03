import { notFound, redirect } from "next/navigation";
import { ApplicationsView } from "@/features/jobs/applications-view";
import { getJob, getOrganisationById } from "@/lib/data/network";
import { listJobApplications } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function JobApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthContext();
  const { id } = await params;
  if (!session.userId) redirect(`/auth/sign-in?next=/jobs/${id}/applications`);
  const job = await getJob(id);
  if (job.meta.error) return <QueryNotice configured={job.meta.configured} error={job.meta.error} />;
  if (!job.data) notFound();
  const org = await getOrganisationById(job.data.organisationId);
  if (org.data?.createdBy !== session.userId) redirect(`/jobs/${id}`);
  const applications = await listJobApplications(id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Applications · {job.data.title}</h1>
      <ApplicationsView kind="job" applications={applications.data} />
    </div>
  );
}
