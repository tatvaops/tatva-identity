import { GigWorkerDirectory } from "@/features/identiti/people-directory";
import { listGigWorkers, listPortfolio } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";

export default async function GigWorkersPage() {
  const people = await listGigWorkers();
  const portfolios: Record<string, { image_url: string; caption: string | null }[]> = {};
  await Promise.all(
    people.data.map(async (person) => {
      const items = await listPortfolio(person.id);
      portfolios[person.id] = items.map((item) => ({ image_url: item.image_url, caption: item.caption }));
    }),
  );
  return (
    <>
      <QueryNotice configured={people.meta.configured} error={people.meta.error} />
      <GigWorkerDirectory people={people.data} portfolios={portfolios} />
    </>
  );
}
