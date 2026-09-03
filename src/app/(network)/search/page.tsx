import { SearchView, type SearchEntity } from "@/features/search/search-view";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const allowed: SearchEntity[] = [
    "all",
    "people",
    "organisations",
    "projects",
    "jobs",
    "gigs",
    "skills",
    "services",
    "posts",
  ];
  const entity = allowed.includes(type as SearchEntity) ? (type as SearchEntity) : "all";
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Search</h1>
      <SearchView initialQuery={q ?? ""} entity={entity} />
    </div>
  );
}
