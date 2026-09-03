import { PersonCard } from "@/components/cards/entity-cards";
import { FilterDrawer } from "@/components/layout/filter-drawer";
import { Input } from "@/components/ui/input";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listPublicProfiles } from "@/lib/data/network";

function PeopleFilters({
  query,
  city,
  availability,
}: {
  query?: string;
  city?: string;
  availability?: string;
}) {
  return (
    <form className="space-y-5" method="get">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Professional</legend>
        <label className="sr-only" htmlFor="people-q">
          Name, trade or skill
        </label>
        <Input id="people-q" name="q" defaultValue={query} placeholder="Name, trade, skill" />
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Location</legend>
        <label className="sr-only" htmlFor="people-city">
          Location
        </label>
        <Input id="people-city" name="city" defaultValue={city} placeholder="City" />
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Availability</legend>
        <label className="sr-only" htmlFor="people-availability">
          Availability
        </label>
        <select
          id="people-availability"
          name="availability"
          defaultValue={availability}
          className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
        >
          <option value="">Any availability</option>
          <option value="open_to_gigs">Open to gigs</option>
          <option value="open_to_jobs">Open to jobs</option>
          <option value="available_immediately">Available immediately</option>
          <option value="open_to_opportunities">Open to opportunities</option>
          <option value="not_looking">Not looking</option>
        </select>
      </fieldset>
      <button type="submit" className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white">
        Apply filters
      </button>
    </form>
  );
}

export async function PeopleDirectory({
  query,
  city,
  availability,
}: {
  query?: string;
  city?: string;
  availability?: string;
}) {
  const people = await listPublicProfiles({ query, city, availability });
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <div className="h-fit rounded-2xl border border-border bg-white p-4">
          <PeopleFilters query={query} city={city} availability={availability} />
        </div>
      </FilterDrawer>
      <div>
        <QueryNotice configured={people.meta.configured} error={people.meta.error} />
        {people.data.length === 0 ? (
          <EmptyState
            title="No professionals match"
            body="Try another location or availability — or no public profiles exist yet."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.data.map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
