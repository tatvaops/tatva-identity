import { redirect } from "next/navigation";
import { JobCreateForm } from "@/features/jobs/opportunity-forms";
import { getAuthContext } from "@/lib/data/query";
import { listOwnedOrganisations } from "@/lib/data/workspace";

export default async function CreateJobPage({
  searchParams,
}: {
  searchParams: Promise<{ organisationId?: string }>;
}) {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/jobs/create");
  const { organisationId } = await searchParams;
  const orgs = await listOwnedOrganisations(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Post a job</h1>
      <JobCreateForm organisations={orgs.data} defaultOrganisationId={organisationId} />
    </div>
  );
}
