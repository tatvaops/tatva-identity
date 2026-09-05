import { notFound } from "next/navigation";
import { ProjectProfileView } from "@/features/projects/project-profile";
import { getProjectBySlug } from "@/lib/data/network";
import { listProductUsesForProject } from "@/lib/data/identiti";
import { listProjectCompanies, listProjectMedia, listProjectPeople } from "@/lib/data/workspace";
import { listFeedPosts } from "@/lib/data/discovery";
import { QueryNotice } from "@/components/states/empty-state";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (project.meta.error) return <QueryNotice configured={project.meta.configured} error={project.meta.error} />;
  if (!project.data) {
    if (!project.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const [contributors, companies, updates, gallery, products] = await Promise.all([
    listProjectPeople(project.data.id),
    listProjectCompanies(project.data),
    listFeedPosts(),
    listProjectMedia(project.data.id),
    listProductUsesForProject(project.data.id),
  ]);
  const client = companies.data.find((org) => org.id === project.data!.clientOrganisationId) ?? null;
  const main = companies.data.find((org) => org.id === project.data!.mainContractorId) ?? null;
  return (
    <ProjectProfileView
      project={project.data}
      client={client}
      main={main}
      contributors={contributors.data}
      companies={companies.data}
      updates={updates.data.filter((post) => post.linkedProjectId === project.data!.id)}
      gallery={gallery.data}
      products={products}
    />
  );
}
