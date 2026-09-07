import Link from "next/link";
import { PersonCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { SafePhotoStrip } from "@/components/identity/media-photo";
import { InitialsAvatar } from "@/components/identity/visuals";
import { FilterDrawer } from "@/components/layout/filter-drawer";
import { Input } from "@/components/ui/input";
import { isGigOccupation, personPublicHref } from "@/lib/domain/identiti-routes";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { getAuthContext } from "@/lib/data/query";
import { getConnectionStates } from "@/lib/data/network";
import type { PublicProfile } from "@/lib/types/identity";

function DirectoryFilters({
  query,
  city,
  availability,
  skill,
}: {
  query?: string;
  city?: string;
  availability?: string;
  skill?: string;
}) {
  return (
    <form className="space-y-4" method="get">
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">Name or headline</span>
        <Input name="q" defaultValue={query} placeholder="Name, trade, skill" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">Skill or trade</span>
        <Input name="skill" defaultValue={skill} placeholder="Skill or trade" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">City</span>
        <Input name="city" defaultValue={city} placeholder="City" />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-semibold">Availability</span>
        <select
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
      </label>
      <button type="submit" className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white">
        Apply filters
      </button>
    </form>
  );
}

export async function IdentitiPeopleDirectory({
  title,
  body,
  people,
  query,
  city,
  availability,
  skill,
}: {
  title: string;
  body: string;
  people: PublicProfile[];
  query?: string;
  city?: string;
  availability?: string;
  skill?: string;
}) {
  const session = await getAuthContext();
  const states = await getConnectionStates(session.userId, people.map((person) => person.id));
  const filtered = Boolean(query || city || availability || skill);
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <div className="h-fit rounded-2xl border border-border bg-white p-4">
          <DirectoryFilters query={query} city={city} availability={availability} skill={skill} />
        </div>
      </FilterDrawer>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#111a42]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[#747a95]">{body}</p>
        {people.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={filtered ? "No matching professionals" : "No people yet"}
            body={
              filtered
                ? "Try another city, skill or availability."
                : "When a professional publishes a passport, they appear here."
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {people.map((person) => (
              <PersonCard key={person.id} profile={person} connectionState={states.get(person.id) ?? "connect"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function GigWorkerDirectory({
  people,
  portfolios,
  query,
  city,
  availability,
  skill,
}: {
  people: PublicProfile[];
  portfolios: Record<string, { image_url: string; caption: string | null }[]>;
  query?: string;
  city?: string;
  availability?: string;
  skill?: string;
}) {
  const workers = people.filter((person) => isGigOccupation(person.occupationMode));
  const filtered = Boolean(query || city || availability || skill);
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <div className="h-fit rounded-2xl border border-border bg-white p-4">
          <DirectoryFilters query={query} city={city} availability={availability} skill={skill} />
        </div>
      </FilterDrawer>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#111a42]">Gig workers</h1>
        <p className="mt-2 max-w-2xl text-[#747a95]">Tradespeople shown by delivered work, not a résumé paragraph.</p>
        {workers.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={filtered ? "No matching gig workers" : "No gig workers yet"}
            body={filtered ? "Try another city, trade or availability." : "When a worker publishes photos, they appear here."}
          />
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {workers.map((person) => {
              const photos = (portfolios[person.id] ?? []).map((photo) => photo.image_url);
              return (
                <Link
                  key={person.id}
                  href={personPublicHref(person.handle, person.occupationMode)}
                  className="overflow-hidden rounded-2xl border border-border bg-white"
                >
                  <SafePhotoStrip urls={photos} />
                  <div className="flex items-start gap-3 p-4">
                    <InitialsAvatar
                      initials={initialsFromName(person.fullName)}
                      hue={hueFromId(person.id)}
                      size={48}
                      src={person.avatarPath}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">{person.fullName}</p>
                      <p className="text-sm text-muted-foreground">{person.headline}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{person.city}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
