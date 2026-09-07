import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoFrame } from "@/components/identity/media-photo";
import { InitialsAvatar, CoverBand } from "@/components/identity/visuals";
import { ProofStrip } from "@/components/ui/section";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { IdentitiNetworkBar } from "@/features/identiti/identiti-network-bar";
import { IdentitiChip, IdentitiSection, visibleAbout } from "@/features/identiti/identiti-chrome";
import { RecommendForm } from "@/features/profile/recommend-form";
import { availabilityLabel } from "@/lib/domain/availability";
import { showAvailability, viewerFromNetwork } from "@/lib/domain/visibility";
import type { Experience, Post, ProfileService, ProfileSkill, PublicProfile, RecommendationRow } from "@/lib/types/identity";
import { SKILL_LEVEL_LABEL } from "@/lib/domain/verification";

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
  posts = [],
  skills = [],
  services = [],
  recommendations = [],
  connectionState = "connect",
  following = false,
  signedIn = false,
  isOwner = false,
  isRecruiter = false,
  saved = false,
  blocked = false,
}: {
  profile: PublicProfile;
  portfolio: PortfolioItem[];
  reviews: SupervisorReview[];
  facts: SkillFact[];
  experiences: Experience[];
  posts?: Post[];
  skills?: ProfileSkill[];
  services?: ProfileService[];
  recommendations?: RecommendationRow[];
  connectionState?: "connect" | "pending" | "incoming" | "connected";
  following?: boolean;
  signedIn?: boolean;
  isOwner?: boolean;
  isRecruiter?: boolean;
  saved?: boolean;
  blocked?: boolean;
}) {
  const viewer = viewerFromNetwork({ isOwner, connectionState, isRecruiter });
  const availability = showAvailability(profile, viewer) ? availabilityLabel(profile.availabilityStatus) : null;
  const rating =
    reviews.filter((item) => item.quality_rating != null).reduce((sum, item) => sum + (item.quality_rating ?? 0), 0) /
    Math.max(1, reviews.filter((item) => item.quality_rating != null).length);
  const hasRating = reviews.some((item) => item.quality_rating != null);
  const featuredReview = reviews[0];
  const cover = profile.coverPath || portfolio[0]?.image_url;
  const about = visibleAbout(profile.about);

  return (
    <div className="space-y-10 pb-14">
      <section className="overflow-hidden border border-border bg-white">
        <CoverBand tone="workshop" className="h-40 md:h-52" src={cover} />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <InitialsAvatar
              initials={initialsFromName(profile.fullName)}
              hue={hueFromId(profile.id)}
              size={96}
              src={profile.avatarPath}
              className="ring-4 ring-white"
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href={`/passport/${profile.handle}`}>Skill passport</Link>
              </Button>
              {isOwner ? (
                <Button asChild>
                  <Link href="/passport">Edit passport</Link>
                </Button>
              ) : null}
              <IdentitiNetworkBar
                profile={profile}
                connectionState={connectionState}
                following={following}
                signedIn={signedIn}
                isOwner={isOwner}
                saved={saved}
                blocked={blocked}
              />
            </div>
          </div>
          <p className="mt-5 type-micro text-brand">Gig worker</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {profile.tradeVerified ? <Badge variant="verify">Verified trade</Badge> : null}
            {profile.identityVerified ? <Badge variant="verify">Verified identity</Badge> : null}
            {availability ? <Badge variant="success">{availability}</Badge> : null}
          </div>
          <h1 className="type-display mt-3 text-4xl sm:text-5xl">{profile.fullName}</h1>
          <p className="mt-2 text-base text-text-secondary">{profile.headline}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {[profile.preferredRoles[0] ?? profile.classification ?? "Site installation", profile.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {about ? <p className="mt-4 max-w-3xl text-[15px] leading-7 text-text-secondary">{about}</p> : null}
        </div>
        <ProofStrip
          items={[
            { label: "Trade", value: profile.preferredRoles[0] ?? profile.classification ?? "—" },
            { label: "Portfolio", value: String(portfolio.length || "—") },
            { label: "Verified photos", value: String(portfolio.filter((item) => item.supervisor_verified || item.brand_verified).length || "—") },
            { label: "Supervisor reviews", value: hasRating ? `${rating.toFixed(1)}/5` : reviews.length ? String(reviews.length) : "—" },
            { label: "Availability", value: availability ?? "—" },
          ]}
        />
      </section>

      <IdentitiSection eyebrow="Portfolio" title="Completed work">
        {portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public work photos yet.{" "}
            {isOwner ? (
              <Link href="/passport?section=evidence" className="font-medium text-brand hover:underline">
                Upload claimed work photos from your passport
              </Link>
            ) : (
              "This space stays empty until real photos exist. Supervisor-verified photos are labelled separately."
            )}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <figure key={item.id} className="overflow-hidden border border-border bg-white">
                <PhotoFrame src={item.image_url} alt={item.caption ?? "Work photo"} className="h-56" />
                <figcaption className="p-3 text-sm">
                  <p className="font-semibold">{item.caption ?? item.work_category}</p>
                  <p className="text-muted-foreground">{[item.location, item.product_used].filter(Boolean).join(" · ")}</p>
                  {item.project ? (
                    <Link href={`/projects/${item.project.slug}`} className="mt-1 block text-xs font-medium text-brand hover:underline">
                      {item.project.name}
                    </Link>
                  ) : null}
                  {item.supervisor_verified || item.brand_verified ? (
                    <p className="mt-1 text-xs font-medium text-verify">
                      {item.supervisor_verified ? "Supervisor verified" : "Brand verified"}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Claimed work photo</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </IdentitiSection>

      {experiences.length > 0 ? (
        <IdentitiSection title="Employment">
          <ol className="relative space-y-4 border-l border-border pl-5">
            {experiences.map((item) => (
              <li key={item.id}>
                <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-brand" aria-hidden />
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-text-secondary">{item.organisationNameText}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.startDate, item.endDate ?? "Present"].filter(Boolean).join(" — ")}
                  {item.source === "organisation_verified" ? " · Employer confirmed" : " · Self declared"}
                </p>
              </li>
            ))}
          </ol>
        </IdentitiSection>
      ) : null}

      {skills.length > 0 ? (
        <IdentitiSection title="Listed skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <IdentitiChip key={skill.id}>
                {skill.skillName} · {SKILL_LEVEL_LABEL[skill.verificationLevel]}
              </IdentitiChip>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {services.length > 0 ? (
        <IdentitiSection title="Services">
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.id} className="border border-border p-4">
                <p className="font-semibold">{service.name}</p>
                {service.description ? <p className="mt-1 text-sm text-text-secondary">{service.description}</p> : null}
              </div>
            ))}
          </div>
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
              <div key={`${fact.id}-detail`} className="bg-surface-muted p-4">
                <p className="font-semibold">{fact.skill_name}</p>
                <p className="text-sm text-text-secondary">
                  {fact.verified_projects ? `${fact.verified_projects} verified projects` : fact.proficiency}
                </p>
                {fact.tools_owned.length > 0 ? <p className="mt-2 text-sm">{fact.tools_owned.join(", ")}</p> : null}
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {featuredReview ? (
        <IdentitiSection title="Supervisor reviews">
          <div className="border border-border p-5">
            <p className="font-semibold">{featuredReview.reviewer_name}</p>
            <p className="text-sm text-muted-foreground">
              {[featuredReview.reviewer_designation, featuredReview.company_name].filter(Boolean).join(" · ")}
              {featuredReview.verified_relationship ? " · Verified relationship" : ""}
            </p>
            <p className="mt-3 text-[15px] leading-7 text-text-secondary">{featuredReview.body}</p>
          </div>
          {reviews.length > 1 ? (
            <div className="mt-3 space-y-3">
              {reviews.slice(1).map((review) => (
                <div key={review.id} className="bg-surface-muted p-4">
                  <p className="font-semibold">{review.reviewer_name}</p>
                  <p className="mt-1 text-sm text-text-secondary">{review.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </IdentitiSection>
      ) : null}

      {recommendations.length > 0 || (signedIn && !isOwner) ? (
        <IdentitiSection title="Peer endorsements">
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.id} className="border-l-2 border-l-brand bg-surface-muted px-4 py-4">
                <p className="type-micro text-brand">{item.relationship ?? "Peer"}</p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{item.body}</p>
              </div>
            ))}
            {signedIn && !isOwner ? <RecommendForm toProfileId={profile.id} /> : null}
          </div>
        </IdentitiSection>
      ) : null}

      <IdentitiSection eyebrow="Activity" title="Recent posts">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public posts yet. Updates this person publishes will appear here from the live feed.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {posts.slice(0, 6).map((post) => (
              <li key={post.id} className="p-4">
                <p className="text-sm leading-6 text-text-secondary">{post.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </IdentitiSection>
    </div>
  );
}
