"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateRequirementFit, REQUIREMENT_OPTIONS, type RequirementId } from "@/lib/domain/requirement-fit";
import { calculateTrustScore } from "@/lib/domain/trust-score";
import { presentAiReview } from "@/lib/domain/ai-review";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { AiReviewRecord, AiReviewSource } from "@/lib/domain/ai-review";
import type { PublicProfile } from "@/lib/types/identity";
import { SaveButton } from "@/components/identity/save-button";
import { PersonCard } from "@/components/cards/entity-cards";
import { PhotoFrame } from "@/components/identity/media-photo";

const FIT_COPY: Record<string, string> = { strong: "Strong match", good: "Good match", clarify: "Clarify" };

export function ServiceBrandView({
  brand,
  projects,
  performance,
  strengths,
  videos,
  ai,
  people,
  saved,
  signedIn,
}: {
  brand: IdentitiBrand;
  projects: IdentitiProject[];
  performance: {
    on_time_pct?: number | null;
    quality_rating?: number | null;
    completed_projects?: number | null;
  } | null;
  strengths: { id: string; title: string; metric_label: string | null; body: string | null }[];
  videos: { id: string; title: string; youtube_url: string; duration_label: string | null }[];
  ai: {
    settings: { source: AiReviewSource; enabled: boolean; minimumSourceCount: number } | null;
    review: AiReviewRecord | null;
  };
  people: PublicProfile[];
  saved: boolean;
  signedIn: boolean;
}) {
  const [requirement, setRequirement] = useState<RequirementId>("premium_interiors");
  const years = brand.foundedYear ? new Date().getFullYear() - brand.foundedYear : null;
  const fit = useMemo(
    () =>
      calculateRequirementFit(requirement, {
        designCapability: brand.designCapability,
        executionCapability: brand.executionCapability,
        typicalMinInr: brand.typicalValueMinInr,
        typicalMaxInr: brand.typicalValueMaxInr,
        serviceAreas: brand.serviceAreas,
        servingRegions: brand.servingRegions,
        deliverySlots: brand.deliverySlots,
        capabilityChips: brand.capabilityChips,
        projectTypes: projects.map((project) => project.type ?? ""),
      }),
    [requirement, brand, projects],
  );
  const trust = calculateTrustScore({
    gstVerified: brand.gstVerified,
    kycVerified: brand.kycVerified,
    verifiedProjects: projects.filter((project) => project.verified).length,
    verifiedReviews: brand.verifiedReviewCount,
    hasQcNotes: projects.some((project) => project.qcNotes),
    onTimePct: performance?.on_time_pct ?? null,
    qualityRating: performance?.quality_rating ?? null,
  });
  const pulse = presentAiReview(ai.review, ai.settings ?? { source: "vantage_forum", enabled: true, minimumSourceCount: 5 });
  const range =
    brand.typicalValueMinInr != null && brand.typicalValueMaxInr != null
      ? `₹${formatInr(brand.typicalValueMinInr)}–₹${formatInr(brand.typicalValueMaxInr)}`
      : null;
  const hero = brand.coverPath || projects[0]?.coverImageUrl;
  const showreel = videos[0];
  const discussHref = signedIn ? `/forum/new/service_brand/${brand.id}` : `/auth/sign-in?next=/service-brands/${brand.slug}`;
  const saveHref = signedIn ? `/forum/go/service_brand/${brand.id}` : `/auth/sign-in?next=/service-brands/${brand.slug}`;

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-[#0b1f3a] text-white">
        <PhotoFrame src={hero} alt="" className="h-56 opacity-80 md:h-72" />
        <div className="p-6 md:p-10">
            {(brand.about ?? "").toLowerCase().includes("demonstration") ? (
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Sample data</p>
            ) : null}
            {showreel ? (
              <a href={showreel.youtube_url} target="_blank" rel="noreferrer" className="mt-3 text-sm underline">
                Watch company showreel
              </a>
            ) : null}
        <div className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {brand.kycVerified || brand.gstVerified ? <Badge variant="verify">TatvaOps verified</Badge> : null}
            {brand.categoryLabel ? <Badge variant="outline" className="border-white/30 text-white">{brand.categoryLabel}</Badge> : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{brand.name}</h1>
          <p className="text-white/80">
            {brand.city}
            {brand.servingRegions ? ` · Serving ${brand.servingRegions}` : ""}
          </p>
          <p className="text-lg">
            <span className="font-semibold">{brand.averageRating?.toFixed(1) ?? "—"}</span>
            <span className="ml-2 text-white/70">{brand.verifiedReviewCount} verified reviews</span>
          </p>
          <p className="max-w-3xl text-white/90">{brand.about}</p>
          <div className="flex flex-wrap gap-2">
            {brand.capabilityChips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/20 px-3 py-1 text-sm">
                {chip}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {signedIn ? (
              <SaveButton kind="organisation" id={brand.id} saved={saved} />
            ) : (
              <Button asChild variant="secondary">
                <Link href={`/auth/sign-in?next=/service-brands/${brand.slug}`}>Save brand</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={discussHref}>Discuss your project</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href={saveHref}>View brand discussions</Link>
            </Button>
          </div>
        </div>
        </div>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Operating history" value={years ? `${years} yrs` : "—"} />
        <Stat label="Projects delivered" value={String(performance?.completed_projects ?? projects.length)} />
        <Stat label="On-time handovers" value={performance?.on_time_pct != null ? `${performance.on_time_pct}%` : "—"} />
        <Stat label="Quality rating" value={performance?.quality_rating != null ? `${performance.quality_rating}/5` : "—"} />
        <Stat label="Typical project range" value={range ?? "—"} />
      </dl>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Requirement fit</p>
        <h2 className="mt-1 text-2xl font-semibold">Is {brand.name.split(" ")[0]} right for your project?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {REQUIREMENT_OPTIONS.slice(0, 4).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setRequirement(option.id)}
              className={`rounded-full border px-3 py-1.5 text-sm ${requirement === option.id ? "border-primary bg-primary text-white" : "border-border bg-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {fit.cards.slice(0, 3).map((card) => (
            <Card key={card.id} className="p-5">
              <p className="text-xs font-semibold uppercase text-primary">{FIT_COPY[card.level]}</p>
              <p className="mt-2 font-semibold">{card.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.reason}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Proof of delivery</p>
        <div className="mt-1 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Featured projects</h2>
          <Link href={`/projects?brand=${brand.slug}`} className="text-sm text-primary hover:underline">
            View all {projects.length} projects
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {projects.slice(0, 2).map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`} className="overflow-hidden rounded-2xl border border-border bg-white">
              <PhotoFrame src={project.coverImageUrl} alt="" className="h-48" />
              <div className="p-5">
                <p className="text-xs text-muted-foreground">{project.type}</p>
                <h3 className="mt-1 text-lg font-semibold">{project.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.city}
                  {project.valueLabel ? ` · ${project.valueLabel}` : ""}
                  {project.durationLabel ? ` · ${project.durationLabel}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {showreel ? (
          <a href={showreel.youtube_url} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-2xl border border-border bg-[#0b1f3a] p-6 text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">YouTube walkthrough · {showreel.duration_label}</p>
            <p className="mt-2 text-lg font-semibold">{showreel.title}</p>
            <p className="mt-4 text-sm underline">Play walkthrough</p>
          </a>
        ) : null}
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">What they do best</p>
        <h2 className="mt-1 text-2xl font-semibold">Strengths customers can verify</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {strengths.map((item) => (
            <Card key={item.id} className="p-5">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-primary">{item.metric_label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AI review pulse</p>
          <p className="mt-2 text-sm font-medium">{pulse.sourceLabel}</p>
          {pulse.state === "ready" && pulse.review ? (
            <>
              <p className="mt-3 text-sm leading-6">{pulse.review.summary}</p>
              <div className="mt-4 flex gap-6 text-sm">
                <span><strong>{pulse.review.overallSentimentPct}%</strong> Positive</span>
                <span><strong>{pulse.review.sourceCount}</strong> Discussions</span>
                <span><strong>{pulse.review.confidenceLabel}</strong> Confidence</span>
              </div>
              {pulse.review.sourceHref ? (
                <Link href={pulse.review.sourceHref} className="mt-4 inline-block text-sm text-primary hover:underline">
                  Read what people said
                </Link>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Not enough eligible {pulse.sourceLabel.replace("Source: ", "")} yet. This is not a fabricated summary.
            </p>
          )}
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tatva trust score</p>
          <p className="mt-2 text-4xl font-semibold">{trust.insufficient ? "—" : trust.label}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {trust.breakdown.map((row) => (
              <li key={row.label} className={row.ok ? "text-foreground" : "text-muted-foreground"}>
                {row.ok ? "✓" : "–"} {row.label}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {people.length > 0 ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Named on delivered work</p>
          <h2 className="mt-1 text-2xl font-semibold">People you can meet on these projects</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {people.map((person) => (
              <PersonCard key={person.id} profile={person} />
            ))}
          </div>
        </section>
      ) : null}

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Delivery capacity</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Current availability</p>
            <p className="text-xl font-semibold">{brand.deliverySlots != null ? `${brand.deliverySlots} slots` : "Ask"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Design phase</p>
            <p className="text-xl font-semibold">{brand.designLeadWeeks != null ? `${brand.designLeadWeeks}–${brand.designLeadWeeks + 2} weeks` : "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active teams</p>
            <p className="text-xl font-semibold">{brand.activeCities != null ? `${brand.activeCities} cities` : "—"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </Card>
  );
}

function formatInr(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `${Math.round(value / 100_000)}L`;
  return value.toLocaleString("en-IN");
}
