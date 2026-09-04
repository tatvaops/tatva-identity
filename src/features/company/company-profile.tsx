import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { BusinessPassport, OrganisationMetricStrip } from "@/features/company/business-passport";
import {
  CompanyHeader,
  OrganisationContact,
  OrganisationCredentials,
  OrganisationJobs,
  OrganisationPeople,
  OrganisationPosts,
  OrganisationProjectGrid,
  OrganisationReviews,
  ServiceCatalogue,
} from "@/features/company/company-sections";
import { organisationMetrics } from "@/lib/domain/org-metrics";
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
  const canEdit = Boolean(session.userId && org.createdBy === session.userId);
  const verifiedCredential = credentials.some((c) => c.verificationState === "verified");
  const metrics = organisationMetrics({
    peopleCount: people.length,
    projects,
    services,
    reviewCount: reviews.length,
    foundedYear: org.foundedYear,
  });

  return (
    <div className="space-y-4">
      <CompanyHeader
        org={org}
        following={following}
        signedIn={Boolean(session.userId)}
        canEdit={canEdit}
        verifiedCredential={verifiedCredential}
      />
      <OrganisationMetricStrip metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="px-2">
          <Tabs defaultValue={tab}>
            <TabsList className="sticky top-14 z-20 bg-white px-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4 px-3 pb-5">
              <p className="text-sm leading-6">{org.about ?? "No overview yet."}</p>
              <BusinessPassport org={org} credentials={credentials} />
              {projects.slice(0, 2).length > 0 ? (
                <OrganisationProjectGrid projects={projects.slice(0, 2)} />
              ) : (
                <EmptyState title="No projects yet" body="Verified project work will appear on this business passport." />
              )}
            </TabsContent>
            <TabsContent value="posts" className="px-3 pb-5">
              <OrganisationPosts posts={posts} orgName={org.name} />
            </TabsContent>
            <TabsContent value="about" className="space-y-3 px-3 pb-5 text-sm">
              <p>{org.about ?? "No about copy yet."}</p>
            </TabsContent>
            <TabsContent value="services" className="px-3 pb-5">
              <ServiceCatalogue services={services} />
            </TabsContent>
            <TabsContent value="projects" className="px-3 pb-5">
              <OrganisationProjectGrid projects={projects} />
            </TabsContent>
            <TabsContent value="people" className="px-3 pb-5">
              <OrganisationPeople people={people} />
            </TabsContent>
            <TabsContent value="jobs" className="px-3 pb-5">
              <OrganisationJobs jobs={jobs} gigs={gigs} orgName={org.name} />
            </TabsContent>
            <TabsContent value="credentials" className="px-3 pb-5">
              <OrganisationCredentials credentials={credentials} />
            </TabsContent>
            <TabsContent value="reviews" className="px-3 pb-5">
              <OrganisationReviews reviews={reviews} organisationId={org.id} canReview={Boolean(session.userId && !canEdit)} />
            </TabsContent>
          </Tabs>
        </Card>
        <OrganisationContact org={org} similar={similar} />
      </div>
    </div>
  );
}
