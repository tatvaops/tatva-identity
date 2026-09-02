import { ProjectCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listProjects } from "@/lib/data/network";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Projects</h1>
      <QueryNotice configured={projects.meta.configured} error={projects.meta.error} />
      {projects.data.length === 0 ? (
        <EmptyState title="No projects yet" body="Public project identity will appear when organisations publish work." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
