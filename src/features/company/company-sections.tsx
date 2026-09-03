import { Globe, MapPin } from "lucide-react";
import Link from "next/link";
import { CompanyCard, GigCard, JobCard, PersonCard, ProjectCard, ServiceCard } from "@/components/cards/entity-cards";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuoteBoundary } from "@/features/company/quote-boundary";
import { CompanyActionBar } from "@/features/company/company-actions";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type {
  GigPost,
  JobPost,
  NetworkProject,
  OrgCredential,
  OrgService,
  Organisation,
  Post,
  PublicProfile,
  ReviewRow,
} from "@/lib/types/identity";

export function CompanyHeader({
  org,
  following,
  signedIn,
  canEdit,
  verifiedCredential,
}: {
  org: Organisation;
  following: boolean;
  signedIn: boolean;
  canEdit: boolean;
  verifiedCredential: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CoverBand tone="office" className="h-36 md:h-44" />
      <div className="px-4 pb-5 md:px-6">
        <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <InitialsAvatar initials={initialsFromName(org.name)} hue={hueFromId(org.id)} size={96} className="rounded-2xl ring-4 ring-white" />
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button variant="outline" asChild>
                <Link href={`/companies/${org.slug}/edit`}>Edit business passport</Link>
              </Button>
            ) : null}
            <CompanyActionBar
              organisationId={org.id}
              slug={org.slug}
              createdBy={org.createdBy}
              following={following}
              signedIn={signedIn}
              type={org.type}
            />
          </div>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{org.name}</h1>
        {org.tagline && <p className="mt-2 text-sm text-foreground">{org.tagline}</p>}
        {verifiedCredential && (
          <Badge variant="verify" className="mt-2">
            Business verification on file
          </Badge>
        )}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{org.type.replaceAll("_", " ")}</span>
          {org.industry && <span>{org.industry}</span>}
          {org.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {org.city}
            </span>
          )}
          {org.foundedYear && <span>Founded {org.foundedYear}</span>}
          {org.teamSizeLabel && <span>{org.teamSizeLabel}</span>}
        </p>
        <Link className="mt-2 inline-block text-sm text-primary hover:underline" href={`/org/${org.slug}/passport`}>
          Public business passport
        </Link>
      </div>
    </Card>
  );
}

export function ServiceCatalogue({ services, canEdit, organisationId }: { services: OrgService[]; canEdit?: boolean; organisationId?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.length === 0 && (
        <div className="sm:col-span-2">
          <EmptyState
            title="No services yet"
            body="A service catalogue lists what this organisation actually provides."
            action={
              canEdit && organisationId ? (
                <Button asChild>
                  <Link href={`/companies/${organisationId}`}>Add a service from edit</Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      )}
      {services.map((s) => (
        <div key={s.id} className="flex h-full flex-col">
          <ServiceCard service={s} />
          <div className="mt-2">
            <QuoteBoundary label="Request quote" variant="outline" fullWidth />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrganisationProjectGrid({ projects }: { projects: NetworkProject[] }) {
  if (projects.length === 0) {
    return <EmptyState title="No projects yet" body="Completed and in-progress work will show here." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

export function OrganisationPeople({ people }: { people: PublicProfile[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <p className="text-xs text-muted-foreground sm:col-span-2">Only people who opted to appear on this organisation.</p>
      {people.length === 0 && (
        <div className="sm:col-span-2">
          <EmptyState title="No public people yet" body="Associated professionals will appear when membership is public." />
        </div>
      )}
      {people.map((p) => (
        <PersonCard key={p.id} profile={p} />
      ))}
    </div>
  );
}

export function OrganisationCredentials({ credentials }: { credentials: OrgCredential[] }) {
  if (credentials.length === 0) {
    return <EmptyState title="No public credentials yet" body="Verification states can be public. Document files stay private." />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {credentials.map((c) => {
        const expired = c.verificationState === "expired";
        return (
          <div key={c.id} className={`rounded-xl border p-3 ${expired ? "border-amber-200 bg-amber-50/40" : "border-border"}`}>
            <p className="text-sm font-medium">{c.name}</p>
            {c.expiryLabel && <p className="mt-1 text-xs text-muted-foreground">{c.expiryLabel}</p>}
            <Badge variant={expired ? "warning" : c.verificationState === "verified" ? "verify" : "outline"} className="mt-2">
              {c.verificationState.replaceAll("_", " ")}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

export function OrganisationReviews({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return <EmptyState title="No verified reviews yet" body="Only project-linked client or employer reviews appear here." />;
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <Card key={r.id} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {r.relationship === "verified_client" ? "Verified client review" : "Verified employer review"}
          </p>
          <p className="mt-2 text-sm">{r.body}</p>
        </Card>
      ))}
    </div>
  );
}

export function OrganisationJobs({ jobs, gigs, orgName }: { jobs: JobPost[]; gigs: GigPost[]; orgName: string }) {
  if (jobs.length === 0 && gigs.length === 0) {
    return <EmptyState title="No opportunities yet" body="Jobs and gigs from this organisation will list here." />;
  }
  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} organisationName={orgName} />
      ))}
      {gigs.map((g) => (
        <GigCard key={g.id} gig={g} organisationName={orgName} />
      ))}
    </div>
  );
}

export function OrganisationContact({ org, similar }: { org: Organisation; similar: Organisation[] }) {
  return (
    <aside className="hidden space-y-4 lg:block">
      <Card className="p-4">
        <p className="text-sm font-semibold">Contact</p>
        {org.website && (
          <a href={org.website} className="mt-2 flex items-center gap-2 text-sm text-primary">
            <Globe className="size-4" /> Website
          </a>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{[org.locality, org.city].filter(Boolean).join(", ")}</p>
        <div className="mt-3">
          <QuoteBoundary label="Enquire" variant="outline" fullWidth />
        </div>
      </Card>
      <div>
        <p className="mb-2 text-sm font-semibold">Similar companies</p>
        {similar.length === 0 && <p className="text-sm text-muted-foreground">None to compare yet.</p>}
        <div className="space-y-3">
          {similar.slice(0, 3).map((o) => (
            <CompanyCard key={o.id} org={o} />
          ))}
        </div>
      </div>
    </aside>
  );
}

export function OrganisationPosts({ posts, orgName }: { posts: Post[]; orgName: string }) {
  if (posts.length === 0) return <EmptyState title="No posts yet" body="Organisation updates will appear here." />;
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} organisationName={orgName} />
      ))}
    </div>
  );
}
