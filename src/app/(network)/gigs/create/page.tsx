import { redirect } from "next/navigation";
import { GigCreateForm } from "@/features/jobs/opportunity-forms";
import { getAuthContext } from "@/lib/data/query";
import { listOptedInProjects } from "@/lib/data/network";
import { listOwnedOrganisations } from "@/lib/data/workspace";

export default async function CreateGigPage({
  searchParams,
}: {
  searchParams: Promise<{ organisationId?: string }>;
}) {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/gigs/create");
  const { organisationId } = await searchParams;
  const [orgs, projects] = await Promise.all([
    listOwnedOrganisations(session.userId),
    listOptedInProjects(session.userId),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Post a gig</h1>
      <p className="text-sm text-muted-foreground">Immediate work — date, shift, location and pay first.</p>
      <GigCreateForm
        organisations={orgs.data}
        defaultOrganisationId={organisationId}
        projects={projects.data}
      />
    </div>
  );
}
