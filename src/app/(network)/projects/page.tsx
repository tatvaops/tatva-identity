import { JournalsFeedView } from "@/features/journals/journals-feed";
import { ProjectCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { getIdentitiBrand, listIdentitiProjects } from "@/lib/data/identiti";
import { listProjects } from "@/lib/data/network";
import { getProjectsMarketPulse, getSiteJournalFacets, listSiteJournals } from "@/lib/data/site-journals";
import { getAuthContext } from "@/lib/data/query";
import type { NetworkProject } from "@/lib/types/identity";
import type { HealthUi } from "@/lib/domain/site-journal";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; q?: string; city?: string; projectType?: string; risk?: string }>;
}) {
  const { brand: brandSlug, q, city, projectType, risk } = await searchParams;
  const session = await getAuthContext();
  const brand = brandSlug ? await getIdentitiBrand(brandSlug) : null;
  const [all, journals, facets, pulse] = await Promise.all([
    listProjects(),
    listSiteJournals({
      q,
      city,
      projectType,
      risk: risk === "stable" || risk === "watch" || risk === "risk" || risk === "all" ? (risk as HealthUi | "all") : undefined,
    }),
    getSiteJournalFacets(),
    getProjectsMarketPulse(),
  ]);
  const brandProjects = brand?.data ? await listIdentitiProjects(brand.data.id) : [];
  const projects: NetworkProject[] = brand?.data
    ? all.data.filter((project) => brandProjects.some((row) => row.id === project.id))
    : all.data;
  return (
    <div className="space-y-10">
      {brand?.data ? (
        <h1 className="mb-1 text-xl font-semibold">{brand.data.name} projects</h1>
      ) : (
        <JournalsFeedView
          journals={journals.data}
          cities={facets.cities}
          types={facets.types}
          pulse={pulse}
          signedIn={Boolean(session.userId)}
          filters={{ q, city, projectType, risk }}
        />
      )}
      <QueryNotice configured={all.meta.configured} error={all.meta.error ?? brand?.meta.error ?? journals.meta.error ?? null} />
      {brand?.data ? (
        <p className="mb-4 text-sm text-muted-foreground">Work this brand is named on as client or main contractor.</p>
      ) : null}
      {projects.length === 0 ? (
        <EmptyState title="No project passports yet" body="Public project identity will appear when organisations publish work." />
      ) : (
        <div>
          {brand?.data ? null : (
            <h2 className="mb-4 type-card">Verified project identity</h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
