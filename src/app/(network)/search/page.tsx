import { SearchView, type SearchEntity } from "@/features/search/search-view";
import { PageHeader } from "@/components/ui/section";

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
      <PageHeader
        eyebrow="Discover"
        title="Search"
        body="People, companies, service brands, product brands, projects, jobs, gigs and services."
      />
      <SearchView initialQuery={q ?? ""} entity={entity} />
    </div>
  );
}
