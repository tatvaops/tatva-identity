import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteJournalView } from "@/features/journals/journal-view";
import { getSiteJournalBySlug, listFieldNotesByEntries } from "@/lib/data/site-journals";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const journal = await getSiteJournalBySlug(slug, true);
  if (journal.data) {
    return entityMetadata({
      title: journal.data.title,
      description: journal.data.aiSummary,
      path: `/journals/${journal.data.slug}`,
      image: journal.data.mediaCover || null,
    });
  }
  return { title: "Site journal" };
}

export default async function SiteJournalPage({ params }: PageProps) {
  const { slug } = await params;
  const journal = await getSiteJournalBySlug(slug, true);
  if (journal.meta.error) return <QueryNotice configured={journal.meta.configured} error={journal.meta.error} />;
  if (!journal.data) {
    if (!journal.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const notes = await listFieldNotesByEntries(journal.data.timelineEntries.map((entry) => entry.id));
  return (
    <SiteJournalView journal={journal.data} notes={notes} signedIn={Boolean(session.userId)} viewerId={session.userId} />
  );
}
