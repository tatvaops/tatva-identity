import { SearchView } from "@/features/search/search-view";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Search</h1>
      <SearchView initialQuery={q ?? ""} />
    </div>
  );
}
