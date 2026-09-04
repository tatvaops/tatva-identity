import { PeopleDirectory } from "@/features/network/people-directory";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; availability?: string; skill?: string; page?: string }>;
}) {
  const p = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">People</h1>
      <PeopleDirectory
        query={p.q}
        city={p.city}
        availability={p.availability}
        skill={p.skill}
        page={Number.parseInt(p.page ?? "1", 10) || 1}
      />
    </div>
  );
}
