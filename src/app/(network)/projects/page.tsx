import { ProjectCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { getIdentitiBrand, listIdentitiProjects } from "@/lib/data/identiti";
import { listProjects } from "@/lib/data/network";
import type { NetworkProject } from "@/lib/types/identity";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand: brandSlug } = await searchParams;
  const brand = brandSlug ? await getIdentitiBrand(brandSlug) : null;
  const all = await listProjects();
  const brandProjects = brand?.data ? await listIdentitiProjects(brand.data.id) : [];
  const projects: NetworkProject[] = brand?.data
    ? all.data.filter((project) => brandProjects.some((row) => row.id === project.id))
    : all.data;
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{brand?.data ? `${brand.data.name} projects` : "Projects"}</h1>
      {brand?.data ? (
        <p className="mb-4 text-sm text-muted-foreground">Work this brand is named on as client or main contractor.</p>
      ) : null}
      <QueryNotice configured={all.meta.configured} error={all.meta.error ?? brand?.meta.error ?? null} />
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Public project identity will appear when organisations publish work." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
