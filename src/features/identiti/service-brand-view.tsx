"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, CirclePlay, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateRequirementFit, REQUIREMENT_OPTIONS, type RequirementId } from "@/lib/domain/requirement-fit";
import { calculateTrustScore } from "@/lib/domain/trust-score";
import { presentAiReview } from "@/lib/domain/ai-review";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { AiReviewRecord, AiReviewSource } from "@/lib/domain/ai-review";
import type { PublicProfile } from "@/lib/types/identity";
import { SaveButton } from "@/components/identity/save-button";
import { PersonCard } from "@/components/cards/entity-cards";
import { PhotoFrame } from "@/components/identity/media-photo";
import { IdentitiChip, IdentitiSection, OverlayHero, StarRating, TrustRing, formatInr } from "@/features/identiti/identiti-chrome";

const FIT_COPY: Record<string, string> = { strong: "Strong match", good: "Good match", clarify: "Clarify" };
const FIT_TONE: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  clarify: "bg-amber-50 text-amber-800 border-amber-200",
};

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
  const firstName = brand.name.split(" ")[0];

  return (
    <div className="space-y-6 pb-14">
      <section className="overflow-hidden rounded-[28px] border border-[#e2e5ef] bg-white shadow-[0_18px_60px_rgba(20,28,73,.09)]">
        <OverlayHero
          src={hero}
          alt={`${brand.name} completed work`}
          action={
            showreel ? (
              <a
                href={showreel.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-white/92 px-4 py-2 text-sm font-bold text-[#111a42] shadow-lg backdrop-blur"
              >
                <CirclePlay className="size-4 text-[#e54b4b]" />
                Watch company showreel
              </a>
            ) : null
          }
        >
          <div className="mb-2 flex flex-wrap gap-2">
            {brand.kycVerified || brand.gstVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="size-3" /> TatvaOps verified
              </span>
            ) : null}
            {brand.categoryLabel ? (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">{brand.categoryLabel}</span>
            ) : null}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{brand.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="size-4" />
            {[brand.city, brand.servingRegions ? `Serving ${brand.servingRegions}` : null].filter(Boolean).join(" · ")}
          </p>
        </OverlayHero>
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <StarRating value={brand.averageRating} count={brand.verifiedReviewCount || null} />
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#555c78]">{brand.about}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.capabilityChips.map((chip) => (
                <IdentitiChip key={chip}>{chip}</IdentitiChip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {signedIn ? (
              <SaveButton kind="organisation" id={brand.id} saved={saved} />
            ) : (
              <Button asChild variant="outline" className="rounded-xl px-5 py-3 font-bold">
                <Link href={`/auth/sign-in?next=/service-brands/${brand.slug}`}>Save brand</Link>
              </Button>
            )}
            <Button asChild className="rounded-xl px-5 py-3 font-bold shadow-[0_10px_24px_rgba(36,55,212,.24)]">
              <Link href={discussHref}>Discuss your project</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-5 border-t border-[#eceef4] px-5 py-5 sm:grid-cols-5 sm:px-7">
          <Stat value={years ? `${years} yrs` : "—"} label="Operating history" />
          <Stat value={String(performance?.completed_projects ?? projects.length)} label="Projects delivered" />
          <Stat value={performance?.on_time_pct != null ? `${performance.on_time_pct}%` : "—"} label="On-time handovers" />
          <Stat value={performance?.quality_rating != null ? `${performance.quality_rating}/5` : "—"} label="Quality rating" />
          <Stat value={range ?? "—"} label="Typical project range" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.7fr)]">
        <div className="space-y-6">
          <IdentitiSection eyebrow="Requirement fit" title={`Is ${firstName} right for your project?`}>
            <div className="flex flex-wrap gap-2">
              {REQUIREMENT_OPTIONS.slice(0, 4).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRequirement(option.id)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    requirement === option.id
                      ? "border-[#2437d4] bg-[#eef0ff] text-[#2437d4]"
                      : "border-[#dfe2eb] text-[#656b85] hover:border-[#afb6d4]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {fit.cards.slice(0, 3).map((card) => (
                <div key={card.id} className="rounded-xl bg-[#f7f8fb] p-4">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${FIT_TONE[card.level]}`}>
                    {FIT_COPY[card.level]}
                  </span>
                  <div className="mt-3 text-sm font-bold text-[#111a42]">{card.label}</div>
                  <p className="mt-1 text-xs leading-5 text-[#747a95]">{card.reason}</p>
                </div>
              ))}
            </div>
          </IdentitiSection>

          <IdentitiSection
            eyebrow="Proof of delivery"
            title="Featured projects"
            action={
              <Link href={`/projects?brand=${brand.slug}`} className="hidden items-center text-sm font-semibold text-[#2437d4] sm:flex">
                View all {projects.length} projects
              </Link>
            }
          >
            {projects.length === 0 ? (
              <p className="text-sm text-[#747a95]">No opted-in projects are public yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.slice(0, 2).map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`} className="group overflow-hidden rounded-2xl border border-[#e4e6ef] bg-white shadow-[0_8px_30px_rgba(25,33,75,.06)]">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <PhotoFrame src={project.coverImageUrl} alt="" className="h-full w-full" />
                      {project.type ? (
                        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold text-[#111a42] shadow-sm">
                          {project.type}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#111a42]">{project.name}</h3>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#777d97]">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {project.city}
                        </span>
                        <span>{[project.valueLabel, project.durationLabel].filter(Boolean).join(" · ")}</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {showreel ? (
              <a
                href={showreel.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 grid gap-3 rounded-2xl bg-[#111a42] p-4 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-white/12">
                    <CirclePlay className="size-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#aeb7ff]">
                      YouTube walkthrough{showreel.duration_label ? ` · ${showreel.duration_label}` : ""}
                    </div>
                    <div className="mt-1 font-bold">{showreel.title}</div>
                  </div>
                </div>
                <span className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-[#111a42]">Play walkthrough</span>
              </a>
            ) : null}
          </IdentitiSection>

          {strengths.length > 0 ? (
            <IdentitiSection eyebrow="What they do best" title="Strengths customers can verify">
              <div className="grid gap-3 sm:grid-cols-2">
                {strengths.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#eceef4] p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111a42]">{item.title}</span>
                      {item.metric_label ? <span className="text-xs font-bold text-emerald-700">{item.metric_label}</span> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#747a95]">{item.body}</p>
                  </div>
                ))}
              </div>
            </IdentitiSection>
          ) : null}

          {people.length > 0 ? (
            <IdentitiSection eyebrow="Named on delivered work" title="People you can meet on these projects">
              <div className="grid gap-3 md:grid-cols-2">
                {people.map((person) => (
                  <PersonCard key={person.id} profile={person} />
                ))}
              </div>
            </IdentitiSection>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[#dce0ff] bg-gradient-to-br from-[#f8f8ff] to-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#2437d4]">AI review pulse</p>
              <IdentitiChip active>{pulse.sourceLabel}</IdentitiChip>
            </div>
            {pulse.state === "ready" && pulse.review ? (
              <>
                <p className="mt-4 text-[15px] leading-7 text-[#303757]">{pulse.review.summary}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e3e5fb] pt-4 text-center">
                  <Stat value={`${pulse.review.overallSentimentPct}%`} label="Positive" />
                  <Stat value={String(pulse.review.sourceCount)} label="Discussions" />
                  <Stat value={pulse.review.confidenceLabel} label="Confidence" />
                </div>
                {pulse.review.sourceHref ? (
                  <Link href={pulse.review.sourceHref} className="mt-4 inline-flex text-sm font-bold text-[#2437d4]">
                    Read what people said
                  </Link>
                ) : (
                  <Link href={`/forum/go/service_brand/${brand.id}`} className="mt-4 inline-flex text-sm font-bold text-[#2437d4]">
                    Read what people said
                  </Link>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#747a95]">
                Not enough eligible sources yet. This is not a fabricated summary.
              </p>
            )}
          </div>

          <IdentitiSection title="Tatva trust score">
            <div className="flex items-center gap-5">
              <TrustRing score={trust.score} insufficient={trust.insufficient} />
              <div className="space-y-2 text-sm text-[#545b78]">
                {trust.breakdown.map((row) => (
                  <div key={row.label} className={row.ok ? "text-[#111a42]" : "text-[#7a7f99]"}>
                    {row.ok ? "✓" : "–"} {row.label}
                  </div>
                ))}
              </div>
            </div>
          </IdentitiSection>

          <IdentitiSection title="Delivery capacity">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#646a84]">Current availability</span>
                <strong className="text-emerald-700">{brand.deliverySlots != null ? `${brand.deliverySlots} slots` : "Ask"}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#2437d4]" style={{ width: brand.deliverySlots != null ? `${Math.min(100, brand.deliverySlots * 24)}%` : "20%" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f7f8fb] p-3">
                  <strong className="block text-[#111a42]">
                    {brand.designLeadWeeks != null ? `${brand.designLeadWeeks}–${brand.designLeadWeeks + 2} weeks` : "—"}
                  </strong>
                  <span className="text-xs text-[#777d97]">Design phase</span>
                </div>
                <div className="rounded-xl bg-[#f7f8fb] p-3">
                  <strong className="block text-[#111a42]">{brand.activeCities != null ? `${brand.activeCities} cities` : "—"}</strong>
                  <span className="text-xs text-[#777d97]">Active teams</span>
                </div>
              </div>
            </div>
          </IdentitiSection>
        </aside>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xl font-extrabold tracking-tight text-[#111a42]">{value}</div>
      <div className="mt-1 text-xs leading-5 text-[#7a7f99]">{label}</div>
    </div>
  );
}
