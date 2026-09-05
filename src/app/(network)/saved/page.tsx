import { redirect } from "next/navigation";
import { CompanyCard, GigCard, JobCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { hydrateSavedGigs, hydrateSavedJobs, hydrateSavedOrgs, listSavedItems } from "@/lib/data/workspace";

export default async function SavedPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/saved");
  const saved = await listSavedItems(session.userId);
  const [jobs, gigs, orgs] = await Promise.all([
    hydrateSavedJobs(saved.data),
    hydrateSavedGigs(saved.data),
    hydrateSavedOrgs(saved.data),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Saved</h1>
      {jobs.length === 0 && gigs.length === 0 && orgs.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Brands, jobs and gigs you save will appear here." />
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => (
            <CompanyCard key={org.id} org={org} />
          ))}
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}
