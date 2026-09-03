import Link from "next/link";
import { MapPin } from "lucide-react";
import { CompanyCard, PassportStrength, ProjectCard, ServiceLedger } from "@/components/cards/entity-cards";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { CredentialCard } from "@/components/identity/credential-card";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProfileActionBar } from "@/features/profile/profile-actions";
import { ProfileSectionEdit } from "@/features/profile/profile-edit";
import type { ProfileMetric } from "@/lib/domain/profile-metrics";
import { headerFlags, SKILL_LEVEL_HELP, SKILL_LEVEL_LABEL, type VerificationFlag } from "@/lib/domain/verification";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { PassportStrength as PassportStrengthValue } from "@/lib/domain/passport-strength";
import { cn } from "@/lib/utils";
import type {
  Experience,
  NetworkProject,
  Organisation,
  Post,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
  ServiceLedgerRow,
} from "@/lib/types/identity";

export function ProfileHeader({
  profile,
  org,
  flags,
  connectionState,
  following,
  hireLabel,
  isOwner,
  signedIn,
}: {
  profile: PublicProfile;
  org: Organisation | null;
  flags: VerificationFlag[];
  connectionState: "connect" | "pending" | "connected";
  following: boolean;
  hireLabel: string;
  isOwner: boolean;
  signedIn: boolean;
}) {
  const visibleFlags = headerFlags(flags);
  return (
    <Card className="overflow-hidden">
      <CoverBand tone="site" className="h-36 md:h-44" />
      <div className="px-4 pb-5 md:px-6">
        <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <InitialsAvatar
              initials={initialsFromName(profile.fullName)}
              hue={hueFromId(profile.id)}
              size={112}
              className="ring-4 ring-white"
            />
            <div className="hidden pb-1 md:block">
              <AvailabilityBadge status={profile.availabilityStatus} />
            </div>
          </div>
          <div className="hidden md:block">
            <ProfileActionBar
              profile={profile}
              connectionState={connectionState}
              following={following}
              hireLabel={hireLabel}
              isOwner={isOwner}
              signedIn={signedIn}
            />
          </div>
        </div>
        <div className="mt-4 md:hidden">
          <AvailabilityBadge status={profile.availabilityStatus} />
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
        {profile.headline && <p className="mt-2 max-w-2xl text-base text-foreground">{profile.headline}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visibleFlags.length === 0 ? (
            <p className="text-xs text-muted-foreground">Verification has not been completed yet.</p>
          ) : (
            visibleFlags.map((v) => <VerificationBadge key={v.kind} flag={v} />)
          )}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {profile.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {[profile.locality, profile.city, profile.state].filter(Boolean).join(", ")}
            </span>
          )}
          {org && (
            <Link href={`/org/${org.slug}`} className="text-primary hover:underline">
              {org.name}
            </Link>
          )}
        </p>
      </div>
    </Card>
  );
}

export function ProfileMetricStrip({ metrics }: { metrics: ProfileMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="bg-white px-4 py-3">
          <p className="text-lg font-semibold tabular-nums">{metric.value}</p>
          <p className="text-xs text-muted-foreground">{metric.label}</p>
        </div>
      ))}
    </Card>
  );
}

export function AboutSection({ profile }: { profile: PublicProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        {profile.about ? (
          <p className="text-sm leading-6">{profile.about}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No about section yet.</p>
        )}
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {profile.languages.length > 0 && <p>Languages: {profile.languages.join(", ")}</p>}
          {profile.preferredWorkLocations.length > 0 && (
            <p>Preferred locations: {profile.preferredWorkLocations.join(", ")}</p>
          )}
          <p>Arrangement: {profile.arrangement.replaceAll("_", " ")}</p>
          <p>Relocate: {profile.willingToRelocate ? "Yes" : "No"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExperienceSection({
  experiences,
  canEdit,
}: {
  experiences: Experience[];
  canEdit: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Experience</h2>
          <p className="text-xs text-muted-foreground">Self-declared roles. Not the same as verified work history.</p>
        </div>
        {canEdit && <ProfileSectionEdit kind="experience" label="Add" />}
      </div>
      {experiences.length === 0 ? (
        <EmptyState
          title="No experience yet"
          body="Self-declared roles appear here. Verified engagements stay in work history."
        />
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <Card key={exp.id} className="border-l-4 border-l-slate-200 p-4">
              <p className="text-sm font-semibold">{exp.title}</p>
              <p className="text-sm text-muted-foreground">{exp.organisationNameText}</p>
              {(exp.startDate || exp.endDate || exp.locationLabel) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[exp.locationLabel, [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" – ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="mt-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {exp.source === "organisation_verified" ? "Organisation verified" : "Self declared"}
              </p>
              {exp.responsibilities.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                  {exp.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function VerifiedExperienceSection({ rows }: { rows: ServiceLedgerRow[] }) {
  return (
    <Card className="border-l-4 border-l-cyan-700">
      <CardHeader>
        <CardTitle>Verified work history</CardTitle>
        <p className="text-sm text-muted-foreground">
          Derived from Tatva operational records when Vertex is connected. Not an editable resume.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title="No verified work history yet"
            body="Verified engagements appear here when Vertex is connected. This is not filled with self-declared roles."
            className="border-0 shadow-none"
          />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <div key={row.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-semibold">{row.projectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.organisationName} · {row.role}
                  </p>
                  <p className="mt-1 text-xs font-medium text-cyan-800">
                    {row.verificationSource === "organisation"
                      ? "Verified by organisation"
                      : "Derived from verified project record"}
                  </p>
                  {row.verifiedShifts != null && (
                    <p className="mt-1 text-sm">{row.verifiedShifts} verified shifts</p>
                  )}
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <ServiceLedger rows={rows} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectPortfolio({
  projects,
  canEdit,
}: {
  projects: NetworkProject[];
  canEdit: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Projects</h2>
        {canEdit && <ProfileSectionEdit kind="project" label="Add" />}
      </div>
      {projects.length === 0 ? (
        <EmptyState title="No verified projects yet" body="Opted-in contributions link to the canonical project page." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export function SkillsSection({ skills, canEdit }: { skills: ProfileSkill[]; canEdit: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Skills</CardTitle>
          <p className="text-xs text-muted-foreground">Verification level is shown as text, not colour alone.</p>
        </div>
        {canEdit && <ProfileSectionEdit kind="skill" label="Add" />}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {skills.length === 0 && (
          <EmptyState title="No skills yet" body="Skills you add will show their verification level." className="w-full border-0 shadow-none py-8" />
        )}
        {skills.map((s) => (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-xl border px-3 py-2",
                  s.verificationLevel === "tatva_verified" && "border-indigo-200 bg-indigo-50",
                  s.verificationLevel === "employer_verified" && "border-cyan-200 bg-cyan-50",
                  s.verificationLevel === "certification_verified" && "border-amber-200 bg-amber-50",
                  s.verificationLevel === "community_endorsed" && "border-border bg-muted/40",
                  s.verificationLevel === "self_declared" && "border-border bg-white",
                )}
              >
                <p className="text-sm font-medium">{s.skillName}</p>
                <p className="text-[11px] text-muted-foreground">{SKILL_LEVEL_LABEL[s.verificationLevel]}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{SKILL_LEVEL_LABEL[s.verificationLevel]}</p>
              <p className="mt-1 text-white/80">{SKILL_LEVEL_HELP[s.verificationLevel]}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </CardContent>
    </Card>
  );
}

export function CredentialsSection({
  certifications,
  canEdit,
}: {
  certifications: ProfileCertification[];
  canEdit: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Credentials</CardTitle>
          <p className="text-xs text-muted-foreground">Public wallet only. Documents stay private.</p>
        </div>
        {canEdit && <ProfileSectionEdit kind="certification" label="Add" />}
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {certifications.length === 0 && (
          <EmptyState
            title="No public credentials yet"
            body="Public credentials show name, issuer and state. Documents stay private."
            className="sm:col-span-2 border-0 shadow-none py-8"
          />
        )}
        {certifications.map((c) => (
          <CredentialCard key={c.id} credential={c} />
        ))}
      </CardContent>
    </Card>
  );
}

export function RecommendationsSection({ recommendations }: { recommendations: RecommendationRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 && (
          <EmptyState title="No recommendations yet" body="Verified references will appear here." className="border-0 shadow-none py-8" />
        )}
        {recommendations.map((r) => (
          <blockquote key={r.id} className="border-l-2 border-primary/30 pl-3 text-sm">
            “{r.body}”
            <footer className="mt-1 text-xs text-muted-foreground">{r.relationship}</footer>
          </blockquote>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProfileSidebar({
  profile,
  org,
  canEdit,
}: {
  profile: PublicProfile;
  org: Organisation | null;
  canEdit: boolean;
}) {
  return (
    <aside className="hidden space-y-4 lg:block">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Availability</p>
          {canEdit && <ProfileSectionEdit kind="availability" label="Edit" />}
        </div>
        <div className="mt-2">
          <AvailabilityBadge status={profile.availabilityStatus} />
        </div>
        {profile.preferredRoles.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{profile.preferredRoles.join(", ")}</p>
        )}
      </Card>
      {org && (
        <div>
          <p className="mb-2 text-sm font-semibold">Organisation</p>
          <CompanyCard org={org} />
        </div>
      )}
    </aside>
  );
}

export function PassportSection({
  strength,
  handle,
}: {
  strength: PassportStrengthValue;
  handle: string;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[15px] font-semibold">Professional passport</h2>
      <PassportStrength
        completeness={strength.completeness}
        components={strength.components}
        hrefFor={(id) => `/passport/${handle}#${id}`}
      />
    </section>
  );
}

export function ProfilePosts({ posts, author }: { posts: Post[]; author: PublicProfile }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[15px] font-semibold">Posts</h2>
      {posts.length === 0 ? (
        <EmptyState title="No posts yet" body="Updates from this professional will appear here." />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} author={author} />)
      )}
    </div>
  );
}
