import Link from "next/link";
import { MapPin } from "lucide-react";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { InitialsAvatar } from "@/components/identity/visuals";
import { ConnectionButton, FollowButton } from "@/components/identity/network-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { flagsFromProfile } from "@/lib/domain/verification";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { GigPost, JobPost, OrgService, Organisation, PublicProfile, NetworkProject } from "@/lib/types/identity";

export function PersonCard({
  profile,
  connectionState = "connect",
  following = false,
}: {
  profile: PublicProfile;
  connectionState?: "connect" | "pending" | "connected";
  following?: boolean;
}) {
  const flags = flagsFromProfile(profile);
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Link href={`/people/${profile.handle}`}>
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/people/${profile.handle}`} className="truncate text-sm font-semibold hover:text-primary">
            {profile.fullName}
          </Link>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {flags.slice(0, 2).map((v) => (
              <VerificationBadge key={v.kind} flag={v} compact />
            ))}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{profile.headline ?? "Professional"}</p>
          {profile.city && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {profile.city}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <ConnectionButton profileId={profile.id} initialState={connectionState} size="sm" />
        <FollowButton personId={profile.id} following={following} size="sm" />
      </div>
    </Card>
  );
}

export function CompanyCard({ org, following = false }: { org: Organisation; following?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Link href={`/companies/${org.slug}`}>
          <InitialsAvatar initials={initialsFromName(org.name)} hue={250} size={48} className="rounded-xl" />
        </Link>
        <div className="min-w-0">
          <Link href={`/companies/${org.slug}`} className="text-sm font-semibold hover:text-primary">
            {org.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{org.tagline}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[org.industry, org.city].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <FollowButton organisationId={org.id} following={following} size="sm" />
      </div>
    </Card>
  );
}

export function JobCard({ job, organisationName }: { job: JobPost; organisationName?: string }) {
  return (
    <Card className="p-4">
      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold hover:text-primary">
        {job.title}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        {[organisationName, job.city, job.salaryLabel].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge>{job.employmentType.replace("_", " ")}</Badge>
        {job.experienceLabel && <Badge variant="outline">{job.experienceLabel}</Badge>}
        {job.easyApply && <Badge variant="primary">Easy Apply</Badge>}
      </div>
    </Card>
  );
}

export function GigCard({ gig, organisationName }: { gig: GigPost; organisationName?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/gigs/${gig.id}`} className="text-sm font-semibold hover:text-primary">
          {gig.title}
        </Link>
        {gig.payLabel && <Badge variant="success">{gig.payLabel}</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {[gig.siteName, gig.shiftLabel, gig.distanceKm != null ? `${gig.distanceKm} km` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {organisationName && <p className="mt-1 text-xs text-muted-foreground">{organisationName}</p>}
    </Card>
  );
}

export function ProjectCard({ project }: { project: NetworkProject }) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-slate-800 to-indigo-900" />
        <div className="p-4">
          <p className="text-sm font-semibold">{project.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
          <div className="mt-2 flex gap-2">
            {project.type && <Badge variant="outline">{project.type}</Badge>}
            {project.verified && <Badge variant="verify">Project verified</Badge>}
            <Badge>{project.status.replace("_", " ")}</Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ServiceCard({ service }: { service: OrgService }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">{service.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
      {service.locations.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{service.locations.join(" · ")}</p>
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

export function PassportStrength({ completeness, components }: { completeness: number; components: { id: string; label: string; complete: boolean; detail: string }[] }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{completeness}% complete — transparent checks, not a hidden score</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${completeness}%` }} />
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {components.map((c) => (
          <li key={c.id} className="flex justify-between gap-3">
            <span>{c.label}</span>
            <span className="text-muted-foreground">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceLedger({ rows }: { rows: { id: string; projectName: string; organisationName: string; role: string; startLabel: string | null; endLabel: string | null; verifiedShifts: number | null; rating: number | null }[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {rows.map((row) => (
        <li key={row.id}>
          <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
          <p className="text-sm font-semibold">{row.projectName}</p>
          <p className="text-xs text-muted-foreground">
            {row.organisationName} · {row.role}
            {row.startLabel ? ` · ${row.startLabel}` : ""}
            {row.endLabel ? `–${row.endLabel}` : ""}
          </p>
          <p className="mt-1 text-sm">
            {row.verifiedShifts != null ? `${row.verifiedShifts} verified shifts` : "Shift count from Vertex when connected"}
            {row.rating != null ? ` · ${row.rating}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
