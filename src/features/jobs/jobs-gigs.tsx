import { GigCard, JobCard } from "@/components/cards/entity-cards";
import { Card } from "@/components/ui/card";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { getOrganisationById, listGigs, listJobs } from "@/lib/data/network";

export async function JobsView() {
  const jobs = await listJobs();
  const names = await Promise.all(jobs.data.map((j) => getOrganisationById(j.organisationId)));
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit space-y-3 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Jobs</p>
        Permanent, contract, part-time, temporary and internships. Publishing a job requires an organisation you
        administer.
      </Card>
      <div className="space-y-3">
        <QueryNotice configured={jobs.meta.configured} error={jobs.meta.error} />
        {jobs.data.length === 0 ? (
          <EmptyState title="No jobs yet" body="Open roles will appear when organisations publish them." />
        ) : (
          jobs.data.map((j, i) => <JobCard key={j.id} job={j} organisationName={names[i]?.data?.name} />)
        )}
      </div>
    </div>
  );
}

export async function GigsView() {
  const gigs = await listGigs();
  const names = await Promise.all(gigs.data.map((g) => getOrganisationById(g.organisationId)));
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit space-y-3 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Gigs</p>
        Short work is not a job. Accepting a gig later creates a Vertex engagement.
      </Card>
      <div className="space-y-3">
        <QueryNotice configured={gigs.meta.configured} error={gigs.meta.error} />
        {gigs.data.length === 0 ? (
          <EmptyState title="No gigs yet" body="Shift and day work will list here when posted." />
        ) : (
          gigs.data.map((g, i) => <GigCard key={g.id} gig={g} organisationName={names[i]?.data?.name} />)
        )}
      </div>
    </div>
  );
}
