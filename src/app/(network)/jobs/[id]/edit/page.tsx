import { notFound, redirect } from "next/navigation";
import { JobCreateForm } from "@/features/jobs/opportunity-forms";
import { getJob } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";
import { listOwnedOrganisations, userCanManageOrganisation } from "@/lib/data/workspace";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthContext();
  if (!session.userId) redirect(`/auth/sign-in?next=/jobs/${id}/edit`);
  const job = await getJob(id);
  if (!job.data) notFound();
  const canManage = await userCanManageOrganisation(session.userId, job.data.organisationId);
  if (!canManage) notFound();
  const orgs = await listOwnedOrganisations(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit job</h1>
      <JobCreateForm organisations={orgs.data} defaultOrganisationId={job.data.organisationId} job={job.data} />
    </div>
  );
}
