import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoFrame } from "@/components/identity/media-photo";
import { InitialsAvatar } from "@/components/identity/visuals";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { PublicProfile } from "@/lib/types/identity";

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
}: {
  profile: PublicProfile;
  portfolio: PortfolioItem[];
  reviews: SupervisorReview[];
  facts: SkillFact[];
}) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-[#0b1f3a] text-white">
        <PhotoFrame src={profile.coverPath} alt="" className="h-40" />
        <div className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Gig worker</p>
        <div className="mt-4 flex items-start gap-4">
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={72} src={profile.avatarPath} />
          <div>
        <div className="flex flex-wrap gap-2">
          {profile.tradeVerified ? <Badge variant="verify">Trade verified</Badge> : null}
          {profile.identityVerified ? <Badge variant="outline" className="border-white/30 text-white">Identity verified</Badge> : null}
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{profile.fullName}</h1>
        <p className="mt-2 text-white/80">{profile.headline}</p>
        <p className="mt-1 text-sm text-white/60">
          {profile.city}
          {profile.preferredRoles[0] ? ` · ${profile.preferredRoles[0]}` : ""}
        </p>
        <p className="mt-4 max-w-3xl text-white/90">{profile.about}</p>
        <div className="mt-6">
          <Button asChild variant="secondary">
            <Link href={`/passport/${profile.handle}`}>Skill passport</Link>
          </Button>
        </div>
          </div>
        </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Work photos</p>
        <h2 className="mt-1 text-2xl font-semibold">What this person has actually built</h2>
        {portfolio.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No public work photos yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                <PhotoFrame src={item.image_url} alt={item.caption ?? "Work photo"} className="h-56" />
                <figcaption className="p-3 text-sm">
                  <p className="font-medium">{item.caption ?? item.work_category}</p>
                  <p className="text-muted-foreground">
                    {[item.location, item.product_used].filter(Boolean).join(" · ")}
                  </p>
                  {item.project ? (
                    <p className="mt-1 text-xs">
                      <Link href={`/projects/${item.project.slug}`} className="text-primary hover:underline">
                        {item.project.name}
                      </Link>
                    </p>
                  ) : null}
                  {item.supervisor_verified || item.brand_verified ? (
                    <p className="mt-1 text-xs text-primary">
                      {item.supervisor_verified ? "Supervisor verified" : "Brand verified"}
                    </p>
                  ) : null}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {facts.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">Skill facts</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {facts.map((fact) => (
              <Card key={fact.id} className="p-4">
                <p className="font-semibold">{fact.skill_name}</p>
                <p className="text-sm text-muted-foreground">
                  {fact.years_experience != null ? `${fact.years_experience} yrs` : ""}
                  {fact.verified_projects ? ` · ${fact.verified_projects} verified projects` : ""}
                </p>
                {fact.tools_owned.length > 0 ? <p className="mt-2 text-sm">{fact.tools_owned.join(", ")}</p> : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">Supervisor reviews</h2>
          <div className="mt-3 grid gap-3">
            {reviews.map((review) => (
              <Card key={review.id} className="p-5">
                <p className="font-semibold">{review.reviewer_name}</p>
                <p className="text-sm text-muted-foreground">
                  {[review.reviewer_designation, review.company_name].filter(Boolean).join(" · ")}
                  {review.verified_relationship ? " · Verified relationship" : ""}
                </p>
                <p className="mt-2 text-sm">{review.body}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
