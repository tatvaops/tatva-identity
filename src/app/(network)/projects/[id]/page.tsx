import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectProfileView } from "@/features/projects/project-profile";
import { RecordProjectView } from "@/features/projects/record-project-view";
import { SiteJournalView } from "@/features/journals/journal-view";
import { getProjectBySlug } from "@/lib/data/network";
import { getSiteJournalBySlug, listFieldNotesByEntries } from "@/lib/data/site-journals";
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
  if (project.data) {
    return entityMetadata({
      title: project.data.name,
      description: project.data.summary,
      path: `/projects/${project.data.slug}`,
      image: project.data.coverImageUrl,
    });
  }
  const journal = await getSiteJournalBySlug(id, true);
  if (journal.data) {
    return entityMetadata({
      title: journal.data.title,
      description: journal.data.aiSummary,
      path: `/projects/${journal.data.slug}`,
      image: journal.data.mediaCover || null,
    });
  }
  return { title: "Project" };
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (project.meta.error) return <QueryNotice configured={project.meta.configured} error={project.meta.error} />;
  if (project.data) {
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
  const journal = await getSiteJournalBySlug(id, true);
  if (journal.meta.error) return <QueryNotice configured={journal.meta.configured} error={journal.meta.error} />;
  if (!journal.data) {
    if (!project.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const notes = await listFieldNotesByEntries(journal.data.timelineEntries.map((entry) => entry.id));
  return (
    <SiteJournalView journal={journal.data} notes={notes} signedIn={Boolean(session.userId)} viewerId={session.userId} />
  );
}
