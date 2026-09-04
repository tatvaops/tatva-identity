import Link from "next/link";
import { CompanyCard, GigCard, JobCard, PersonCard, ProjectCard, ServiceCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { SearchBox } from "@/features/search/search-box";
import { searchNetwork } from "@/lib/data/discovery";
import { createServerSupabase } from "@/lib/supabase/server";

const ENTITY_FILTERS = [
  ["all", "All"],
  ["people", "People"],
  ["organisations", "Organisations"],
  ["projects", "Projects"],
  ["jobs", "Jobs"],
  ["gigs", "Gigs"],
  ["skills", "Skills"],
  ["services", "Services"],
  ["posts", "Posts"],
] as const;

export type SearchEntity = (typeof ENTITY_FILTERS)[number][0];

function SearchResultGroup({
  title,
  children,
  count,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-[15px] font-semibold">
        {title} <span className="text-muted-foreground">({count})</span>
      </h2>
      {children}
    </section>
  );
}

export async function SearchView({
  initialQuery = "",
  entity = "all",
}: {
  initialQuery?: string;
  entity?: SearchEntity;
}) {
  const results = await searchNetwork(initialQuery);
  if (initialQuery.trim() && results.people.length > 0) {
    const supabase = await createServerSupabase();
    if (supabase) {
      await supabase.from("search_appearances").insert(
        results.people.slice(0, 12).map((person) => ({
          profile_id: person.id,
          query: initialQuery.trim(),
        })),
      );
    }
  }
  const show = (kind: SearchEntity) => entity === "all" || entity === kind;
  const empty =
    (show("people") ? results.people.length : 0) +
      (show("organisations") ? results.companies.length : 0) +
      (show("jobs") ? results.jobs.length : 0) +
      (show("gigs") ? results.gigs.length : 0) +
      (show("projects") ? results.projects.length : 0) +
      (show("posts") ? results.posts.length : 0) +
      (show("skills") ? results.skills.length : 0) +
      (show("services") ? results.services.length : 0) ===
    0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SearchBox key={`${initialQuery}-${entity}`} initialQuery={initialQuery} size="page" entity={entity} />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Search category">
          {ENTITY_FILTERS.map(([value, label]) => (
            <Link
              key={value}
              href={`/search?q=${encodeURIComponent(initialQuery)}&type=${value}`}
              role="tab"
              aria-selected={entity === value}
              className={`rounded-full border px-3 py-1 text-sm ${
                entity === value ? "border-primary bg-primary/5 text-primary" : "border-border"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <QueryNotice configured={results.meta.configured} error={results.meta.error} />
      {empty ? (
        <EmptyState
          title="No results"
          body={initialQuery ? "Nothing matches that search yet." : "Search people, skills, jobs, companies or projects."}
        />
      ) : (
        <>
          {show("people") && (
            <SearchResultGroup title="People" count={results.people.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.people.map((p) => (
                  <PersonCard key={p.id} profile={p} />
                ))}
              </div>
            </SearchResultGroup>
          )}
          {show("organisations") && (
            <SearchResultGroup title="Organisations" count={results.companies.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.companies.map((o) => (
                  <CompanyCard key={o.id} org={o} />
                ))}
              </div>
            </SearchResultGroup>
          )}
          {show("jobs") && (
            <SearchResultGroup title="Jobs" count={results.jobs.length}>
              {results.jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </SearchResultGroup>
          )}
          {show("gigs") && (
            <SearchResultGroup title="Gigs" count={results.gigs.length}>
              {results.gigs.map((g) => (
                <GigCard key={g.id} gig={g} />
              ))}
            </SearchResultGroup>
          )}
          {show("projects") && (
            <SearchResultGroup title="Projects" count={results.projects.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </SearchResultGroup>
          )}
          {show("skills") && (
            <SearchResultGroup title="Skills" count={results.skills.length}>
              <div className="flex flex-wrap gap-2">
                {results.skills.map((s) => (
                  <Link key={s.id} href={`/search?q=${encodeURIComponent(s.name)}`} className="rounded-full border border-border px-3 py-1 text-sm">
                    {s.name}
                  </Link>
                ))}
              </div>
            </SearchResultGroup>
          )}
          {show("services") && (
            <SearchResultGroup title="Services" count={results.services.length}>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </SearchResultGroup>
          )}
          {show("posts") && (
            <SearchResultGroup title="Posts" count={results.posts.length}>
              {results.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </SearchResultGroup>
          )}
        </>
      )}
    </div>
  );
}
