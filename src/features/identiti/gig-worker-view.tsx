import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoFrame } from "@/components/identity/media-photo";
import { InitialsAvatar } from "@/components/identity/visuals";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { IdentitiChip, IdentitiSection } from "@/features/identiti/identiti-chrome";
import type { Experience, PublicProfile } from "@/lib/types/identity";

type PortfolioItem = {
  id: string;
  kind: string;
  image_url: string;
  caption: string | null;
  work_category: string | null;
  location: string | null;
  product_used: string | null;
  supervisor_verified: boolean;
  brand_verified: boolean;
  project?: { slug: string; name: string } | null;
};

type SupervisorReview = {
  id: string;
  reviewer_name: string;
  reviewer_designation: string | null;
  company_name: string | null;
  quality_rating: number | null;
  body: string | null;
  verified_relationship: boolean;
};

type SkillFact = {
  id: string;
  skill_name: string;
  proficiency: string | null;
  years_experience: number | null;
  verified_projects: number;
  tools_owned: string[];
};

export function GigWorkerView({
  profile,
  portfolio,
  reviews,
  facts,
  experiences,
}: {
  profile: PublicProfile;
  portfolio: PortfolioItem[];
  reviews: SupervisorReview[];
  facts: SkillFact[];
  experiences: Experience[];
}) {
  const rating =
    reviews.filter((item) => item.quality_rating != null).reduce((sum, item) => sum + (item.quality_rating ?? 0), 0) /
    Math.max(1, reviews.filter((item) => item.quality_rating != null).length);
  const hasRating = reviews.some((item) => item.quality_rating != null);
  const featuredReview = reviews[0];

  return (
    <div className="space-y-6 pb-14">
      <section className="overflow-hidden rounded-[28px] border border-[#e2e5ef] bg-white shadow-[0_18px_60px_rgba(20,28,73,.09)]">
        <div className="bg-[#111a42] p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Gig worker</p>
          <div className="mt-4 flex items-start gap-4">
            <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={80} src={profile.avatarPath} />
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.tradeVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="size-3" /> Trade verified
                  </span>
                ) : null}
                {profile.identityVerified ? <IdentitiChip>Identity verified</IdentitiChip> : null}
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{profile.fullName}</h1>
              <p className="mt-2 text-white/80">{profile.headline}</p>
              <p className="mt-1 text-sm text-white/60">{[profile.preferredRoles[0] ?? "Site installation", profile.city].filter(Boolean).join(" · ")}</p>
              <p className="mt-4 max-w-3xl text-white/90">{profile.about}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="secondary" className="rounded-xl font-bold">
                  <Link href={`/passport/${profile.handle}`}>Skill passport</Link>
                </Button>
                <Button asChild className="rounded-xl bg-white font-bold text-[#111a42] hover:bg-white/90">
                  <Link href={`/messages?to=${profile.handle}`}>Check availability</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-5 px-5 py-5 sm:grid-cols-3 sm:px-7">
          <Stat value={String(portfolio.filter((item) => item.supervisor_verified || item.brand_verified).length || portfolio.length)} label="Verified projects" />
          <Stat value={hasRating ? `${rating.toFixed(1)}/5` : "—"} label="Supervisor rating" />
          <Stat value={String(portfolio.length)} label="Photo portfolio" />
        </div>
      </section>

      <IdentitiSection
        eyebrow="Photo portfolio"
        title="What this person has actually built"
        action={portfolio.length > 6 ? <span className="text-sm font-semibold text-[#2437d4]">View all {portfolio.length} uploads</span> : null}
      >
        {portfolio.length === 0 ? (
          <p className="text-sm text-[#747a95]">No public work photos yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-2xl border border-[#e4e6ef] bg-white">
                <PhotoFrame src={item.image_url} alt={item.caption ?? "Work photo"} className="h-56" />
                <figcaption className="p-3 text-sm">
                  <p className="font-bold text-[#111a42]">{item.caption ?? item.work_category}</p>
                  <p className="text-[#747a95]">{[item.location, item.product_used].filter(Boolean).join(" · ")}</p>
                  {item.project ? (
                    <Link href={`/projects/${item.project.slug}`} className="mt-1 block text-xs font-semibold text-[#2437d4]">
                      {item.project.name}
                    </Link>
                  ) : null}
                  {item.supervisor_verified || item.brand_verified ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {item.supervisor_verified ? "Supervisor verified" : "Brand verified"}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </IdentitiSection>

      {experiences.length > 0 ? (
        <IdentitiSection title="Verified employment">
          <ol className="space-y-3">
            {experiences.map((item) => (
              <li key={item.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="font-bold text-[#111a42]">{item.title}</p>
                <p className="text-sm text-[#747a95]">{item.organisationNameText}</p>
                <p className="mt-1 text-xs text-[#7a7f99]">
                  {[item.startDate, item.endDate ?? "Present"].filter(Boolean).join(" — ")}
                  {item.source === "organisation_verified" ? " · Employer confirmed" : ""}
                </p>
              </li>
            ))}
          </ol>
        </IdentitiSection>
      ) : null}

      {facts.length > 0 ? (
        <IdentitiSection eyebrow="Skill passport" title="What they can do on site">
          <div className="flex flex-wrap gap-2">
            {facts.map((fact) => (
              <IdentitiChip key={fact.id}>
                {fact.skill_name}
                {fact.years_experience != null ? ` · ${fact.years_experience} yrs` : ""}
              </IdentitiChip>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {facts.map((fact) => (
              <div key={`${fact.id}-detail`} className="rounded-xl bg-[#f7f8fb] p-4">
                <p className="font-bold text-[#111a42]">{fact.skill_name}</p>
                <p className="text-sm text-[#747a95]">
                  {fact.verified_projects ? `${fact.verified_projects} verified projects` : fact.proficiency}
                </p>
                {fact.tools_owned.length > 0 ? <p className="mt-2 text-sm">{fact.tools_owned.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {featuredReview ? (
        <IdentitiSection title="Supervisor review">
          <div className="rounded-xl border border-[#eceef4] p-5">
            <p className="font-bold text-[#111a42]">{featuredReview.reviewer_name}</p>
            <p className="text-sm text-[#747a95]">
              {[featuredReview.reviewer_designation, featuredReview.company_name].filter(Boolean).join(" · ")}
              {featuredReview.verified_relationship ? " · Verified relationship" : ""}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-[#303757]">{featuredReview.body}</p>
          </div>
          {reviews.length > 1 ? (
            <div className="mt-3 space-y-3">
              {reviews.slice(1).map((review) => (
                <div key={review.id} className="rounded-xl bg-[#f7f8fb] p-4">
                  <p className="font-semibold">{review.reviewer_name}</p>
                  <p className="mt-1 text-sm text-[#555c78]">{review.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </IdentitiSection>
      ) : null}
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
