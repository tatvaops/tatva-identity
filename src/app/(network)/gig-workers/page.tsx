import { GigWorkerDirectory } from "@/features/identiti/people-directory";
import { listGigWorkers, listPortfoliosForProfiles } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";

export default async function GigWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; availability?: string; skill?: string }>;
}) {
  const filters = await searchParams;
  const people = await listGigWorkers({
    query: filters.q,
    city: filters.city,
    availability: filters.availability,
    skill: filters.skill,
  });
  const grouped = await listPortfoliosForProfiles(people.data.map((person) => person.id));
  const portfolios: Record<string, { image_url: string; caption: string | null }[]> = {};
  for (const [id, items] of Object.entries(grouped)) {
    portfolios[id] = items.slice(0, 3).map((item) => ({ image_url: item.image_url, caption: item.caption }));
  }
  return (
    <>
      <QueryNotice configured={people.meta.configured} error={people.meta.error} />
      <GigWorkerDirectory
        people={people.data}
        portfolios={portfolios}
        query={filters.q}
        city={filters.city}
        availability={filters.availability}
        skill={filters.skill}
      />
    </>
  );
}
