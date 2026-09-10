import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PhotoFrame } from "@/components/identity/media-photo";
import { YoutubeEmbed } from "@/components/identity/youtube-embed";
import { PageHeader } from "@/components/ui/section";
import { EntryFieldNotes, SiteJournalEntryComposer, SubmitJournalButton } from "@/features/journals/journal-forms";
import type { FieldNoteView, SiteJournalProject } from "@/lib/domain/site-journal";
import { siteJournalPath } from "@/lib/domain/site-journal-routes";

function healthVariant(health: SiteJournalProject["health"]) {
  if (health === "risk") return "danger" as const;
  if (health === "watch") return "warning" as const;
  return "success" as const;
}

function riskVariant(risk: "low" | "medium" | "high") {
  if (risk === "high") return "danger" as const;
  if (risk === "medium") return "warning" as const;
  return "outline" as const;
}

export function SiteJournalView({
  journal,
  notes,
  signedIn,
  viewerId,
}: Readonly<{
  journal: SiteJournalProject;
  notes: Record<string, FieldNoteView[]>;
  signedIn: boolean;
  viewerId?: string | null;
}>) {
  const owner = journal.canEdit && journal.ownerId === viewerId;
  return (
    <div className="space-y-6 pb-14">
      <PageHeader
        eyebrow="Site journal"
        title={journal.title}
        body={[journal.city, journal.region, journal.budgetRange].filter(Boolean).join(" · ") || journal.aiSummary}
        action={
          owner && journal.status === "draft" ? <SubmitJournalButton slug={journal.slug} /> : null
        }
      />
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={healthVariant(journal.health)}>{journal.health}</Badge>
        <Badge variant="outline">{journal.status.replaceAll("_", " ")}</Badge>
        {journal.projectType ? <Badge variant="outline">{journal.projectType}</Badge> : null}
        <Badge variant="muted">Week {journal.timeline.week}</Badge>
        <Badge variant="muted">{journal.timeline.progressPercent}%</Badge>
      </div>
      {journal.mediaCover ? <PhotoFrame src={journal.mediaCover} alt="" className="h-64 md:h-80" /> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 text-sm">
          <p className="type-micro text-muted-foreground">Procurement</p>
          <p className="mt-2">{journal.procurementSignal}</p>
        </Card>
        <Card className="p-4 text-sm">
          <p className="type-micro text-muted-foreground">Execution</p>
          <p className="mt-2">{journal.executionStatus}</p>
        </Card>
        <Card className="p-4 text-sm">
          <p className="type-micro text-muted-foreground">Risk pulse</p>
          <p className="mt-2">{journal.aiRiskPulse}</p>
        </Card>
      </div>
      {journal.canEdit ? <SiteJournalEntryComposer slug={journal.slug} /> : null}
      <section className="space-y-4">
        <h2 className="type-card">Weekly timeline</h2>
        {journal.timelineEntries.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No weekly entries yet.</Card>
        ) : (
          journal.timelineEntries.map((entry) => (
            <Card key={entry.id} className="p-5">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">Week {entry.weekNumber}</Badge>
                <Badge variant="muted">{entry.entryType}</Badge>
                <Badge variant={riskVariant(entry.riskLevel)}>
                  {entry.riskLevel} risk
                </Badge>
              </div>
              <h3 className="mt-3 font-semibold">{entry.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{entry.content}</p>
              {entry.aiInsight ? <p className="mt-3 text-sm text-brand">{entry.aiInsight}</p> : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {entry.media.map((item) =>
                  item.type === "video" ? (
                    <YoutubeEmbed key={item.url} url={item.url} title={item.caption ?? entry.title} />
                  ) : (
                    <PhotoFrame key={item.url} src={item.url} alt={item.caption ?? ""} className="h-40" />
                  ),
                )}
              </div>
              <EntryFieldNotes
                slug={journal.slug}
                entryId={entry.id}
                notes={notes[entry.id] ?? []}
                signedIn={signedIn}
                viewerId={viewerId}
              />
            </Card>
          ))
        )}
      </section>
      {journal.similarProjects.length > 0 ? (
        <section>
          <h2 className="type-card">Related journals</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {journal.similarProjects.map((slug) => (
              <Link key={slug} href={siteJournalPath(slug)} className="text-sm font-medium text-brand hover:underline">
                {slug}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
