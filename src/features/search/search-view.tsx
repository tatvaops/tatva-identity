import Link from "next/link";
import { CompanyCard, GigCard, JobCard, PersonCard, ProjectCard, ServiceCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { Input } from "@/components/ui/input";
import { searchNetwork } from "@/lib/data/network";
import { searchPlaceholder } from "@/lib/config";

export async function SearchView({ initialQuery = "" }: { initialQuery?: string }) {
  const results = await searchNetwork(initialQuery);
  const empty =
    results.people.length +
      results.companies.length +
      results.jobs.length +
      results.gigs.length +
      results.projects.length +
      results.posts.length +
      results.skills.length +
      results.services.length ===
    0;

  return (
    <div className="space-y-6">
      <form method="get">
        <Input name="q" defaultValue={initialQuery} placeholder={searchPlaceholder} aria-label="Universal search" className="h-12" />
      </form>
      <QueryNotice configured={results.meta.configured} error={results.meta.error} />
      {empty ? (
        <EmptyState
          title="No results"
          body={initialQuery ? "Nothing matches that search yet." : "Search people, skills, jobs, companies or projects."}
        />
      ) : (
        <>
          {results.people.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">People</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.people.map((p) => (
                  <PersonCard key={p.id} profile={p} />
                ))}
              </div>
            </section>
          )}
          {results.companies.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Companies</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.companies.map((o) => (
                  <CompanyCard key={o.id} org={o} />
                ))}
              </div>
            </section>
          )}
          {results.jobs.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Jobs</h2>
              {results.jobs.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </section>
          )}
          {results.gigs.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Gigs</h2>
              {results.gigs.map((g) => (
                <GigCard key={g.id} gig={g} />
              ))}
            </section>
          )}
          {results.projects.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Projects</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
          {results.skills.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {results.skills.map((s) => (
                  <Link key={s.id} href={`/search?q=${encodeURIComponent(s.name)}`} className="rounded-full border border-border px-3 py-1 text-sm">
                    {s.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.services.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Services</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {results.services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </section>
          )}
          {results.posts.length > 0 && (
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Posts</h2>
              {results.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
