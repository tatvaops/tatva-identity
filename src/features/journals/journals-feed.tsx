"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PhotoFrame } from "@/components/identity/media-photo";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import type { SiteJournalProject } from "@/lib/domain/site-journal";

function healthVariant(health: SiteJournalProject["health"]) {
  if (health === "risk") return "danger" as const;
  if (health === "watch") return "warning" as const;
  return "success" as const;
}

export function JournalCard({ journal }: { journal: SiteJournalProject }) {
  return (
    <Link href={`/projects/${journal.slug}`}>
      <Card className="overflow-hidden">
        <PhotoFrame src={journal.mediaCover || null} alt="" className="h-40" />
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={healthVariant(journal.health)}>{journal.health}</Badge>
            {journal.projectType ? <Badge variant="outline">{journal.projectType}</Badge> : null}
            {journal.featured ? <Badge variant="primary">Featured</Badge> : null}
          </div>
          <h2 className="type-card">{journal.title}</h2>
          <p className="text-sm text-muted-foreground">
            {[journal.city, journal.region].filter(Boolean).join(", ") || "Location not set"}
            {journal.budgetRange ? ` · ${journal.budgetRange}` : ""}
          </p>
          <p className="text-sm text-text-secondary">{journal.updatePreview || "No weekly entry yet."}</p>
          <p className="text-xs text-muted-foreground">
            Week {journal.timeline.week} · {journal.timeline.progressPercent}% · {journal.timeline.stage}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export function JournalsFeedView({
  journals,
  cities,
  types,
  pulse,
  signedIn,
  filters,
}: {
  journals: SiteJournalProject[];
  cities: string[];
  types: string[];
  pulse: { published: number; watch: number; risk: number; cities: number };
  signedIn: boolean;
  filters: { q?: string; city?: string; projectType?: string; risk?: string };
}) {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        eyebrow="Site journals"
        title="Live execution diaries"
        body="Weekly field updates for procurement, labour, milestones and risk. This is not a Vertex site record and it does not hire or quote."
        action={
          signedIn ? (
            <Button asChild>
              <Link href="/projects/new">Start a journal</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/auth/sign-in?next=/projects/new">Sign in to start</Link>
            </Button>
          )
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Published", pulse.published],
          ["Procurement watch", pulse.watch],
          ["Delay risk", pulse.risk],
          ["Cities", pulse.cities],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="type-micro text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>
      <form
        className="mb-6 grid gap-2 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const next = new URLSearchParams();
          for (const key of ["q", "city", "projectType", "risk"] as const) {
            const value = String(form.get(key) ?? "").trim();
            if (value && value !== "all") next.set(key, value);
          }
          router.push(`/projects${next.toString() ? `?${next}` : ""}`);
        }}
      >
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search title or city"
          aria-label="Search journals"
          className="h-10 rounded-lg border border-input px-3 text-sm"
        />
        <select name="city" defaultValue={filters.city ?? ""} className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="City">
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          name="projectType"
          defaultValue={filters.projectType ?? ""}
          className="h-10 rounded-lg border border-input px-2 text-sm"
          aria-label="Project type"
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <select name="risk" defaultValue={filters.risk ?? "all"} className="h-10 flex-1 rounded-lg border border-input px-2 text-sm" aria-label="Health">
            <option value="all">All health</option>
            <option value="stable">Stable</option>
            <option value="watch">Watch</option>
            <option value="risk">Risk</option>
          </select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </div>
      </form>
      {journals.length === 0 ? (
        <EmptyState title="No published journals yet" body="When a diary is reviewed and published, it appears here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {journals.map((journal) => (
            <JournalCard key={journal.id} journal={journal} />
          ))}
        </div>
      )}
    </div>
  );
}
