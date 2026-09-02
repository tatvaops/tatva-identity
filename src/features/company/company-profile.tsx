import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
import { CompanyCard, GigCard, JobCard, PersonCard, ProjectCard, ServiceCard } from "@/components/cards/entity-cards";
import { FollowButton } from "@/components/identity/network-buttons";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteBoundary } from "@/features/company/quote-boundary";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { getAuthContext } from "@/lib/data/query";
import { isFollowing } from "@/lib/data/network";
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

export async function CompanyProfileView({
  org,
  tab = "overview",
  people,
  services,
  projects,
  jobs,
  gigs,
  reviews,
  credentials,
  posts,
  similar,
}: {
  org: Organisation;
  tab?: string;
  people: PublicProfile[];
  services: OrgService[];
  projects: NetworkProject[];
  jobs: JobPost[];
  gigs: GigPost[];
  reviews: ReviewRow[];
  credentials: OrgCredential[];
  posts: Post[];
  similar: Organisation[];
}) {
  const session = await getAuthContext();
  const following = session.userId ? await isFollowing(session.userId, { organisationId: org.id }) : false;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CoverBand tone="office" className="h-36 md:h-44" />
        <div className="px-4 pb-5 md:px-6">
          <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <InitialsAvatar initials={initialsFromName(org.name)} hue={hueFromId(org.id)} size={96} className="rounded-2xl ring-4 ring-white" />
            <div className="flex flex-wrap gap-2">
              <FollowButton organisationId={org.id} following={following} />
              <Button variant="outline" asChild>
                <Link href={session.userId ? "/messages" : "/auth/sign-in"}>Message</Link>
              </Button>
              <QuoteBoundary />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{org.tagline}</p>
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
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="px-2">
          <Tabs defaultValue={tab}>
            <TabsList className="sticky top-14 z-20 bg-white px-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 px-3 pb-5">
              <p className="text-sm leading-6">{org.about ?? "No overview yet."}</p>
              {projects.slice(0, 2).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
              {projects.length === 0 && <EmptyState title="No projects yet" body="Verified project work will appear on this business passport." />}
            </TabsContent>
            <TabsContent value="posts" className="space-y-3 px-3 pb-5">
              {posts.length === 0 ? (
                <EmptyState title="No posts yet" body="Organisation updates will appear here." />
              ) : (
                posts.map((p) => <PostCard key={p.id} post={p} organisationName={org.name} />)
              )}
            </TabsContent>
            <TabsContent value="about" className="space-y-3 px-3 pb-5 text-sm">
              <p>{org.about ?? "No about copy yet."}</p>
            </TabsContent>
            <TabsContent value="services" className="grid gap-3 px-3 pb-5 sm:grid-cols-2">
              {services.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState title="No services yet" body="A service catalogue will list what this organisation actually provides." />
                </div>
              )}
              {services.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </TabsContent>
            <TabsContent value="projects" className="grid gap-3 px-3 pb-5 sm:grid-cols-2">
              {projects.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState title="No projects yet" body="Completed and in-progress work will show here." />
                </div>
              )}
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </TabsContent>
            <TabsContent value="people" className="grid gap-3 px-3 pb-5 sm:grid-cols-2">
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Only people who opted to appear on this organisation.
              </p>
              {people.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState title="No public people yet" body="Associated professionals will appear when membership is public." />
                </div>
              )}
              {people.map((p) => (
                <PersonCard key={p.id} profile={p} />
              ))}
            </TabsContent>
            <TabsContent value="jobs" className="space-y-3 px-3 pb-5">
              {jobs.length === 0 && gigs.length === 0 && (
                <EmptyState title="No opportunities yet" body="Jobs and gigs from this organisation will list here." />
              )}
              {jobs.map((j) => (
                <JobCard key={j.id} job={j} organisationName={org.name} />
              ))}
              {gigs.map((g) => (
                <GigCard key={g.id} gig={g} organisationName={org.name} />
              ))}
            </TabsContent>
            <TabsContent value="credentials" className="grid gap-3 px-3 pb-5 sm:grid-cols-2">
              {credentials.length === 0 && (
                <div className="sm:col-span-2">
                  <EmptyState title="No public credentials yet" body="Verification states can be public. Document files stay private." />
                </div>
              )}
              {credentials.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">{c.name}</p>
                  <Badge variant={c.verificationState === "verified" ? "verify" : "warning"} className="mt-2">
                    {c.verificationState.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="reviews" className="space-y-3 px-3 pb-5">
              {reviews.length === 0 && (
                <EmptyState title="No verified reviews yet" body="Only project-linked client or employer reviews appear here." />
              )}
              {reviews.map((r) => (
                <Card key={r.id} className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r.relationship === "verified_client" ? "Verified client review" : "Verified employer review"}
                  </p>
                  <p className="mt-2 text-sm">{r.body}</p>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </Card>
        <aside className="hidden space-y-4 lg:block">
          <Card className="p-4">
            <p className="text-sm font-semibold">Contact</p>
            {org.website && (
              <a href={org.website} className="mt-2 flex items-center gap-2 text-sm text-primary">
                <Globe className="size-4" /> Website
              </a>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {[org.locality, org.city].filter(Boolean).join(", ")}
            </p>
            <div className="mt-3">
              <QuoteBoundary />
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
      </div>
    </div>
  );
}
