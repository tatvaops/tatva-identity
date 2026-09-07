import { notFound, redirect } from "next/navigation";
import { GigCreateForm } from "@/features/jobs/opportunity-forms";
import { getGig } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";
import { listOwnedOrganisations, userCanManageOrganisation } from "@/lib/data/workspace";
import { listOptedInProjects } from "@/lib/data/network";

export default async function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthContext();
  if (!session.userId) redirect(`/auth/sign-in?next=/gigs/${id}/edit`);
  const gig = await getGig(id);
  if (!gig.data) notFound();
  const canManage = await userCanManageOrganisation(session.userId, gig.data.organisationId);
  if (!canManage) notFound();
  const [orgs, projects] = await Promise.all([
    listOwnedOrganisations(session.userId),
    listOptedInProjects(session.userId),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit gig</h1>
      <GigCreateForm
        organisations={orgs.data}
        defaultOrganisationId={gig.data.organisationId}
        projects={projects.data}
        gig={gig.data}
      />
    </div>
  );
}
