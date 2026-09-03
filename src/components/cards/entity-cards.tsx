import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { InitialsAvatar } from "@/components/identity/visuals";
import { ConnectionButton } from "@/components/identity/network-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

const PASSPORT_HREF: Record<string, string> = {
  identity: "/passport?section=identity",
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
  connectionState?: "connect" | "pending" | "connected";
  following?: boolean;
}) {
  const flags = headerFlags(flagsFromProfile(profile));
  const trade = profile.classification ?? profile.preferredRoles[0] ?? null;
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Link href={`/people/${profile.handle}`} aria-label={profile.fullName}>
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/people/${profile.handle}`} className="truncate text-sm font-semibold hover:text-primary">
            {profile.fullName}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{profile.headline ?? "Professional"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AvailabilityBadge status={profile.availabilityStatus} />
            {flags.slice(0, 1).map((v) => (
              <VerificationBadge key={v.kind} flag={v} compact />
            ))}
          </div>
          {profile.city && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" aria-hidden />
              {profile.city}
            </p>
          )}
          {trade && <p className="mt-1 text-xs text-muted-foreground">{trade}</p>}
        </div>
      </div>
      <div className="mt-3">
        <ConnectionButton profileId={profile.id} initialState={connectionState} size="sm" />
      </div>
    </Card>
  );
}

export function CompanyCard({ org }: { org: Organisation; following?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Link href={`/org/${org.slug}`} aria-label={org.name}>
          <InitialsAvatar initials={initialsFromName(org.name)} hue={250} size={48} className="rounded-xl" />
        </Link>
        <div className="min-w-0">
          <Link href={`/org/${org.slug}`} className="text-sm font-semibold hover:text-primary">
            {org.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{organisationTypeLabel(org.type)}</p>
          {org.tagline && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{org.tagline}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{[org.industry, org.city].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
    </Card>
  );
}

export function JobCard({ job, organisationName }: { job: JobPost; organisationName?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Job</p>
      <Link href={`/jobs/${job.id}`} className="mt-1 block text-sm font-semibold hover:text-primary">
        {job.title}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        {[organisationName, job.city, job.salaryLabel].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge>{job.employmentType.replace("_", " ")}</Badge>
        {job.experienceLabel && <Badge variant="outline">{job.experienceLabel}</Badge>}
        {job.skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
      </p>
    </Card>
  );
}

export function GigCard({ gig, organisationName }: { gig: GigPost; organisationName?: string }) {
  return (
    <Card className="border-l-4 border-l-emerald-600 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-emerald-800 uppercase">Gig</p>
          <Link href={`/gigs/${gig.id}`} className="mt-1 block text-sm font-semibold hover:text-primary">
            {gig.title}
          </Link>
        </div>
        {gig.payLabel && <Badge variant="success">{gig.payLabel}</Badge>}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {gig.startLabel && (
          <li className="flex items-center gap-1.5">
            <Clock className="size-3" aria-hidden />
            <span>
              {gig.startLabel}
              {gig.shiftLabel ? ` · ${gig.shiftLabel}` : ""}
              {gig.duration ? ` · ${gig.duration}` : ""}
            </span>
          </li>
        )}
        {(gig.siteName || gig.distanceKm != null) && (
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3" aria-hidden />
            {[gig.siteName, gig.distanceKm != null ? `${gig.distanceKm} km` : null].filter(Boolean).join(" · ")}
          </li>
        )}
        {gig.trade && <li>Trade: {gig.trade}</li>}
        {gig.seats != null && <li>{gig.seats} {gig.seats === 1 ? "seat" : "seats"}</li>}
        {organisationName && <li>{organisationName}</li>}
      </ul>
    </Card>
  );
}

export function ProjectCard({ project, roleTitle }: { project: NetworkProject; roleTitle?: string }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="h-24 bg-gradient-to-r from-slate-800 to-indigo-900" />
        <div className="p-4">
          <p className="text-sm font-semibold">{project.name}</p>
          {roleTitle && <p className="mt-1 text-xs text-muted-foreground">{roleTitle}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.type && <Badge variant="outline">{project.type}</Badge>}
            {project.verified ? <Badge variant="verify">Verified project</Badge> : null}
            <Badge>{project.status.replace("_", " ")}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ServiceCard({ service }: { service: OrgService }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <p className="text-sm font-semibold">{service.name}</p>
      {service.description && <p className="mt-1 flex-1 text-sm text-muted-foreground">{service.description}</p>}
      {service.locations.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Coverage: {service.locations.join(" · ")}</p>
      )}
      {service.pricingModel && <p className="mt-1 text-xs">{service.pricingModel}</p>}
    </Card>
  );
}

export function ProfileMiniCard({ profile }: { profile: PublicProfile }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-14 bg-gradient-to-r from-slate-800 to-indigo-900" />
      <div className="-mt-6 px-4 pb-4">
        <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={52} />
        <Link href={`/people/${profile.handle}`} className="mt-2 block text-sm font-semibold">
          {profile.fullName}
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{profile.headline}</p>
        <div className="mt-2">
          <AvailabilityBadge status={profile.availabilityStatus} />
        </div>
      </div>
    </Card>
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
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
      <h2 className="text-[15px] font-semibold text-indigo-950">Professional passport</h2>
      <p className="mt-1 text-sm text-slate-700">
        This profile is backed by verified professional information where a check has completed.
      </p>
      <p className="mt-2 text-sm text-slate-700">
        {verifiedCount} verified · {completeness}% of sections present. Not a hidden score.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {components.map((c) => (
          <li key={c.id}>
            <Link
              href={hrefFor?.(c.id) ?? PASSPORT_HREF[c.id] ?? "/passport"}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="font-medium">{c.label}</span>
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  c.status === "verified" && "text-cyan-800",
                  c.status === "present" && "text-indigo-800",
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
    <ol className="relative space-y-4 border-l border-border pl-5">
      {rows.map((row) => (
        <li key={row.id}>
          <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" aria-hidden />
          <p className="text-sm font-semibold">{row.projectName}</p>
          <p className="text-xs text-muted-foreground">
            {row.organisationName} · {row.role}
            {row.startLabel ? ` · ${row.startLabel}` : ""}
            {row.endLabel ? `–${row.endLabel}` : ""}
          </p>
          <p className="mt-1 text-xs font-medium text-cyan-800">{provenanceLabel(row.verificationSource)}</p>
          {row.verifiedShifts != null ? (
            <p className="mt-1 text-sm">{row.verifiedShifts} verified shifts</p>
          ) : null}
          {row.rating != null ? <p className="text-sm">Rating {row.rating}</p> : null}
        </li>
      ))}
    </ol>
  );
}
