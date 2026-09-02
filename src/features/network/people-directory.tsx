import { PersonCard } from "@/components/cards/entity-cards";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listPublicProfiles } from "@/lib/data/network";

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
      <Card className="h-fit p-4">
        <p className="text-sm font-semibold">Filters</p>
        <form className="mt-3 space-y-3" method="get">
          <Input name="q" defaultValue={query} placeholder="Name, trade, skill" />
          <Input name="city" defaultValue={city} placeholder="Location" />
          <select
            name="availability"
            defaultValue={availability}
            className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
          >
            <option value="">Any availability</option>
            <option value="open_to_gigs">Open to gigs</option>
            <option value="available_immediately">Available immediately</option>
            <option value="open_to_opportunities">Open to opportunities</option>
            <option value="not_looking">Not looking</option>
          </select>
          <button type="submit" className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white">
            Apply
          </button>
        </form>
      </Card>
      <div>
        <QueryNotice configured={people.meta.configured} error={people.meta.error} />
        {people.data.length === 0 ? (
          <EmptyState title="No professionals match" body="No opportunities match your filters — or no profiles exist yet." />
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
