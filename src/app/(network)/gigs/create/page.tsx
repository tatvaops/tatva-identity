import { redirect } from "next/navigation";
import { GigCreateForm } from "@/features/jobs/opportunity-forms";
import { getAuthContext } from "@/lib/data/query";
import { listOwnedOrganisations } from "@/lib/data/workspace";

export default async function CreateGigPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/gigs/create");
  const orgs = await listOwnedOrganisations(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Post a gig</h1>
      <p className="text-sm text-muted-foreground">Immediate work — date, shift, location and pay first.</p>
      <GigCreateForm organisations={orgs.data} />
    </div>
  );
}
