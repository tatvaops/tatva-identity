import Link from "next/link";
import { PersonCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { personPublicHref } from "@/lib/domain/identiti-routes";
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
            <div key={person.id}>
              <PersonCard profile={person} />
              <p className="mt-2 px-1 text-xs text-muted-foreground">
                <Link href={personPublicHref(person.handle, person.occupationMode)} className="hover:underline">
                  Open public profile
                </Link>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GigWorkerDirectory({ people, portfolios }: { people: PublicProfile[]; portfolios: Record<string, { image_url: string; caption: string | null }[]> }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Gig workers</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Tradespeople shown by delivered work, not a résumé paragraph.
      </p>
      {people.length === 0 ? (
        <EmptyState className="mt-6" title="No gig workers yet" body="When a worker publishes photos, they appear here." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {people.map((person) => {
            const photos = portfolios[person.id] ?? [];
            return (
              <Link key={person.id} href={personPublicHref(person.handle, person.occupationMode)} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="grid grid-cols-3 gap-px bg-border">
                  {(photos.length ? photos : [{ image_url: "", caption: null }, { image_url: "", caption: null }, { image_url: "", caption: null }])
                    .slice(0, 3)
                    .map((photo, index) => (
                      <div key={`${person.id}-${index}`} className="h-28 bg-[#0b1f3a]">
                        {photo.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    ))}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{person.fullName}</p>
                  <p className="text-sm text-muted-foreground">{person.headline}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{person.city}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
