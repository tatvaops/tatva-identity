import { GigCard, JobCard } from "@/components/cards/entity-cards";
import { FilterDrawer } from "@/components/layout/filter-drawer";
import { PageNav } from "@/components/layout/page-nav";
import { Input } from "@/components/ui/input";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { getOrganisationById, listGigs, listJobs } from "@/lib/data/network";

const PAGE_SIZE = 24;

export async function JobsView({
  city,
  employmentType,
  page = 1,
}: {
  city?: string;
  employmentType?: string;
  page?: number;
}) {
  const jobs = await listJobs({ city, employmentType }, { page, pageSize: PAGE_SIZE });
  const names = await Promise.all(jobs.data.map((j) => getOrganisationById(j.organisationId)));
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <form method="get" className="h-fit space-y-5 rounded-2xl border border-border bg-white p-4 text-sm">
          <p className="font-semibold text-foreground">Jobs</p>
          <p className="text-muted-foreground">Permanent and contract roles. Not the same as gigs.</p>
          <fieldset className="space-y-2">
            <legend className="font-semibold text-foreground">Location</legend>
            <label className="sr-only" htmlFor="job-city">
              City
            </label>
            <Input id="job-city" name="city" defaultValue={city} placeholder="City" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-semibold text-foreground">Employment type</legend>
            <label className="sr-only" htmlFor="job-type">
              Employment type
            </label>
            <select
              id="job-type"
              name="type"
              defaultValue={employmentType}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            >
              <option value="">Any type</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="part_time">Part time</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
            </select>
          </fieldset>
          <button type="submit" className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white">
            Apply filters
          </button>
        </form>
      </FilterDrawer>
      <div className="space-y-3">
        <QueryNotice configured={jobs.meta.configured} error={jobs.meta.error} />
        {jobs.data.length === 0 ? (
          <EmptyState title="No jobs yet" body="Open roles will appear when organisations publish them." />
        ) : (
          jobs.data.map((j, i) => <JobCard key={j.id} job={j} organisationName={names[i]?.data?.name} />)
        )}
        <PageNav path="/jobs" page={page} hasMore={jobs.data.length === PAGE_SIZE} params={{ city, type: employmentType }} />
      </div>
    </div>
  );
}

export async function GigsView({ city, trade, page = 1 }: { city?: string; trade?: string; page?: number }) {
  const gigs = await listGigs({ city, trade }, { page, pageSize: PAGE_SIZE });
  const names = await Promise.all(gigs.data.map((g) => getOrganisationById(g.organisationId)));
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <form method="get" className="h-fit space-y-5 rounded-2xl border border-border bg-white p-4 text-sm">
          <p className="font-semibold text-foreground">Gigs</p>
          <p className="text-muted-foreground">Immediate work. Date, shift and pay first — not a job listing.</p>
          <p className="text-muted-foreground">Nearest first when distance is known.</p>
          <fieldset className="space-y-2">
            <legend className="font-semibold text-foreground">Location</legend>
            <label className="sr-only" htmlFor="gig-city">
              Site or city
            </label>
            <Input id="gig-city" name="city" defaultValue={city} placeholder="Site or city" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-semibold text-foreground">Trade</legend>
            <label className="sr-only" htmlFor="gig-trade">
              Trade
            </label>
            <Input id="gig-trade" name="trade" defaultValue={trade} placeholder="Trade" />
          </fieldset>
          <button type="submit" className="h-10 w-full min-h-12 rounded-lg bg-primary text-sm font-medium text-white">
            Apply filters
          </button>
        </form>
      </FilterDrawer>
      <div className="space-y-3">
        <QueryNotice configured={gigs.meta.configured} error={gigs.meta.error} />
        {gigs.data.length === 0 ? (
          <EmptyState title="No gigs yet" body="Shift and day work will list here when posted." />
        ) : (
          gigs.data.map((g, i) => <GigCard key={g.id} gig={g} organisationName={names[i]?.data?.name} />)
        )}
        <PageNav path="/gigs" page={page} hasMore={gigs.data.length === PAGE_SIZE} params={{ city, trade }} />
      </div>
    </div>
  );
}
