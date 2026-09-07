import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectProfileView } from "@/features/projects/project-profile";
import { RecordProjectView } from "@/features/projects/record-project-view";
import { getProjectBySlug } from "@/lib/data/network";
import { listProductUsesForProject } from "@/lib/data/identiti";
import { isSaved, listProjectCompanies, listProjectMedia, listProjectPeople } from "@/lib/data/workspace";
import { listFeedPosts } from "@/lib/data/discovery";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (!project.data) return { title: "Project" };
  return entityMetadata({
    title: project.data.name,
    description: project.data.summary,
    path: `/projects/${project.data.slug}`,
    image: project.data.coverImageUrl,
  });
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (project.meta.error) return <QueryNotice configured={project.meta.configured} error={project.meta.error} />;
  if (!project.data) {
    if (!project.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const [contributors, companies, updates, gallery, products, saved] = await Promise.all([
    listProjectPeople(project.data.id),
    listProjectCompanies(project.data),
    listFeedPosts({ projectId: project.data.id, viewerId: session.userId }),
    listProjectMedia(project.data.id),
    listProductUsesForProject(project.data.id),
    session.userId ? isSaved(session.userId, "project", project.data.id) : Promise.resolve(false),
  ]);
  const client = companies.data.find((org) => org.id === project.data!.clientOrganisationId) ?? null;
  const main = companies.data.find((org) => org.id === project.data!.mainContractorId) ?? null;
  return (
    <>
      <RecordProjectView projectId={project.data.id} />
      <ProjectProfileView
        project={project.data}
        client={client}
        main={main}
        contributors={contributors.data}
        companies={companies.data}
        updates={updates.data}
        gallery={gallery.data}
        products={products}
        saved={saved}
        signedIn={Boolean(session.userId)}
      />
    </>
  );
}
