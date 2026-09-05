import Link from "next/link";
import { PersonCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { SafePhotoStrip } from "@/components/identity/media-photo";
import { InitialsAvatar } from "@/components/identity/visuals";
import { isGigOccupation, personPublicHref } from "@/lib/domain/identiti-routes";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { PublicProfile } from "@/lib/types/identity";

export function IdentitiPeopleDirectory({
  title,
  body,
  people,
}: {
  title: string;
  body: string;
  people: PublicProfile[];
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{body}</p>
      {people.length === 0 ? (
        <EmptyState className="mt-6" title="No people yet" body="When a verified professional is published, they appear here." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {people.map((person) => (
            <PersonCard key={person.id} profile={person} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GigWorkerDirectory({
  people,
  portfolios,
}: {
  people: PublicProfile[];
  portfolios: Record<string, { image_url: string; caption: string | null }[]>;
}) {
  const workers = people.filter((person) => isGigOccupation(person.occupationMode));
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Gig workers</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Tradespeople shown by delivered work, not a résumé paragraph.
      </p>
      {workers.length === 0 ? (
        <EmptyState className="mt-6" title="No gig workers yet" body="When a worker publishes photos, they appear here." />
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
  );
}
