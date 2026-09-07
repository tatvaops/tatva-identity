import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { InitialsAvatar } from "@/components/identity/visuals";
import { ConnectionButton } from "@/components/identity/network-buttons";
import { Badge } from "@/components/ui/badge";
import { flagsFromProfile, headerFlags } from "@/lib/domain/verification";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { organisationTypeLabel } from "@/lib/domain/org-config";
import type {
  GigPost,
  JobPost,
  OrgService,
  Organisation,
  PublicProfile,
  NetworkProject,
} from "@/lib/types/identity";
import type { PassportComponent } from "@/lib/domain/passport-strength";
import { brandPublicHref, personPublicHref } from "@/lib/domain/identiti-routes";
import { PhotoFrame } from "@/components/identity/media-photo";
import { cn } from "@/lib/utils";

const PASSPORT_HREF: Record<string, string> = {
  identity: "/passport?section=identity",
  headline: "/passport?section=identity",
  location: "/passport?section=availability",
  education: "/passport?section=education",
  employment: "/passport?section=employment",
  skills: "/passport?section=skills",
  credentials: "/passport?section=credentials",
  projects: "/passport?section=projects",
  references: "/passport?section=references",
};

const PASSPORT_STATUS_LABEL = {
  verified: "Verified",
  present: "Present",
  not_provided: "Not provided",
} as const;

export function PersonCard({
  profile,
  connectionState = "connect",
}: {
  profile: PublicProfile;
  connectionState?: "connect" | "pending" | "incoming" | "connected";
  following?: boolean;
}) {
  const flags = headerFlags(flagsFromProfile(profile));
  const trade = profile.classification ?? profile.preferredRoles[0] ?? null;
  const href = personPublicHref(profile.handle, profile.occupationMode);
  return (
    <article className="group border border-border bg-white p-4">
      <div className="flex gap-3">
        <Link href={href} aria-label={profile.fullName}>
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={52} src={profile.avatarPath} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[15px] font-semibold tracking-tight hover:text-brand">
            {profile.fullName}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{profile.headline ?? "Professional"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <AvailabilityBadge status={profile.availabilityStatus} />
            {flags.slice(0, 2).map((v) => (
              <VerificationBadge key={v.kind} flag={v} compact />
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {profile.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {profile.city}
              </span>
            ) : null}
            {trade ? <span>{trade}</span> : null}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <ConnectionButton profileId={profile.id} initialState={connectionState} size="sm" />
      </div>
    </article>
  );
}

export function CompanyCard({ org }: { org: Organisation; following?: boolean }) {
  const href = brandPublicHref(org.passportKind ?? "other", org.slug);
  return (
    <Link href={href} className="group block">
      <article className="overflow-hidden border border-border bg-white">
        <PhotoFrame src={org.coverPath} alt="" className="h-32" />
        <div className="flex gap-3 p-4">
          <InitialsAvatar initials={initialsFromName(org.name)} hue={250} size={44} className="rounded-md" src={org.logoPath} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight group-hover:text-brand">{org.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{organisationTypeLabel(org.type)}</p>
            {org.tagline ? <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{org.tagline}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">{[org.industry, org.city].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function JobCard({ job, organisationName }: { job: JobPost; organisationName?: string }) {
  return (
    <article className="border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="type-micro">{organisationName ?? "Job"}</p>
        <Badge variant={job.closedAt ? "muted" : "success"}>{job.closedAt ? "Closed" : "Open"}</Badge>
      </div>
      <Link href={`/jobs/${job.id}`} className="mt-1.5 block text-[15px] font-semibold tracking-tight hover:text-brand">
        {job.title}
      </Link>
      <p className="mt-1.5 text-sm text-text-secondary">
        {[job.city, job.employmentType.replaceAll("_", " "), job.salaryLabel].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1">
        <Badge variant="outline">{job.employmentType.replace("_", " ")}</Badge>
        {job.experienceLabel ? <Badge variant="outline">{job.experienceLabel}</Badge> : null}
        {job.skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">
        Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
      </p>
    </article>
  );
}

export function GigCard({ gig, organisationName }: { gig: GigPost; organisationName?: string }) {
  const chips = [
    gig.trade,
    gig.startLabel,
    gig.shiftLabel,
    gig.siteName,
    gig.seats != null ? `${gig.seats} ${gig.seats === 1 ? "seat" : "seats"}` : null,
    gig.payLabel,
  ].filter(Boolean) as string[];
  return (
    <article className="border-l-2 border-l-brand border-y border-r border-border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="type-micro text-brand">Gig</p>
          <Link href={`/gigs/${gig.id}`} className="mt-1 block text-[15px] font-semibold tracking-tight hover:text-brand">
            {gig.title}
          </Link>
        </div>
        <Badge variant={gig.closedAt ? "muted" : "success"}>{gig.closedAt ? "Closed" : "Open"}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <Badge key={chip} variant="outline">
            {chip}
          </Badge>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
        {gig.startLabel && gig.duration ? (
          <li className="flex items-center gap-1.5">
            <Clock className="size-3" aria-hidden />
            {gig.startLabel}
            {gig.duration ? ` · ${gig.duration}` : ""}
          </li>
        ) : null}
        {(gig.siteName || gig.distanceKm != null) && (
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3" aria-hidden />
            {[gig.siteName, gig.distanceKm != null ? `${gig.distanceKm} km` : null].filter(Boolean).join(" · ")}
          </li>
        )}
        {organisationName ? <li>{organisationName}</li> : null}
      </ul>
    </article>
  );
}

export function ProjectCard({ project, roleTitle }: { project: NetworkProject; roleTitle?: string }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group block">
      <article className="overflow-hidden border border-border bg-white">
        <PhotoFrame src={project.coverImageUrl} alt="" className="h-44" />
        <div className="p-4">
          <p className="text-[15px] font-semibold tracking-tight group-hover:text-brand">{project.name}</p>
          {roleTitle ? <p className="mt-1 text-xs text-muted-foreground">{roleTitle}</p> : null}
          <p className="mt-1 text-sm text-text-secondary">
            {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.type ? <Badge variant="outline">{project.type}</Badge> : null}
            {project.verified ? <Badge variant="verify">Verified project</Badge> : null}
            <Badge variant="muted">{project.status.replace("_", " ")}</Badge>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ServiceCard({ service }: { service: OrgService }) {
  const href = service.organisationSlug
    ? brandPublicHref(service.passportKind ?? "other", service.organisationSlug)
    : null;
  const body = (
    <article className="flex h-full flex-col border border-border bg-white p-4">
      <p className="text-[15px] font-semibold tracking-tight">{service.name}</p>
      {service.description ? <p className="mt-1 flex-1 text-sm text-text-secondary">{service.description}</p> : null}
      {service.locations.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Coverage: {service.locations.join(" · ")}</p>
      ) : null}
      {service.pricingModel ? <p className="mt-1 text-xs">{service.pricingModel}</p> : null}
      {service.organisationName ? <p className="mt-2 text-xs text-muted-foreground">{service.organisationName}</p> : null}
    </article>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  );
}

export function ProfileMiniCard({ profile }: { profile: PublicProfile }) {
  return (
    <article className="overflow-hidden border border-border bg-white p-4">
      <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={48} src={profile.avatarPath} />
      <Link href={personPublicHref(profile.handle, profile.occupationMode)} className="mt-2 block text-[15px] font-semibold tracking-tight hover:text-brand">
        {profile.fullName}
      </Link>
      <p className="line-clamp-2 text-sm text-text-secondary">{profile.headline}</p>
      <div className="mt-2">
        <AvailabilityBadge status={profile.availabilityStatus} />
      </div>
    </article>
  );
}

export function PassportStrength({
  completeness,
  components,
  hrefFor,
}: {
  completeness: number;
  components: PassportComponent[];
  hrefFor?: (id: string) => string;
}) {
  const verifiedCount = components.filter((c) => c.status === "verified").length;
  return (
    <div className="border border-border bg-white p-5">
      <p className="type-micro text-brand">Passport evidence</p>
      <h2 className="mt-1 type-section">Professional passport</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        This profile is backed by labelled professional information where a check has completed. Not a hidden score.
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {verifiedCount} verified · {completeness}% of sections present.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {components.map((c) => (
          <li key={c.id}>
            <Link
              href={hrefFor?.(c.id) ?? PASSPORT_HREF[c.id] ?? "/passport"}
              className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm hover:border-brand/40"
            >
              <span className="font-medium">{c.label}</span>
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  c.status === "verified" && "text-verify",
                  c.status === "present" && "text-brand",
                  c.status === "not_provided" && "text-muted-foreground",
                )}
              >
                {PASSPORT_STATUS_LABEL[c.status]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function provenanceLabel(source?: "organisation" | "project_record" | "vertex") {
  if (source === "organisation") return "Verified by organisation";
  if (source === "project_record") return "Derived from verified project record";
  return "Derived from verified operational record";
}

export function ServiceLedger({
  rows,
}: {
  rows: {
    id: string;
    projectName: string;
    organisationName: string;
    role: string;
    startLabel: string | null;
    endLabel: string | null;
    verifiedShifts: number | null;
    rating: number | null;
    verificationSource?: "organisation" | "project_record" | "vertex";
  }[];
}) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {rows.map((row) => (
        <li key={row.id}>
          <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-brand" aria-hidden />
          <p className="text-sm font-semibold">{row.projectName}</p>
          <p className="text-xs text-muted-foreground">
            {row.organisationName} · {row.role}
            {row.startLabel ? ` · ${row.startLabel}` : ""}
            {row.endLabel ? `–${row.endLabel}` : ""}
          </p>
          <p className="mt-1 text-xs font-medium text-verify">{provenanceLabel(row.verificationSource)}</p>
          {row.verifiedShifts != null ? (
            <p className="mt-1 text-sm">{row.verifiedShifts} verified shifts</p>
          ) : null}
          {row.rating != null ? <p className="text-sm">Rating {row.rating}</p> : null}
        </li>
      ))}
    </ol>
  );
}
