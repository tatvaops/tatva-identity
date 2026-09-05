import { notFound, redirect } from "next/navigation";
import { CompanyProfileView } from "@/features/company/company-profile";
import { getIdentitiBrand } from "@/lib/data/identiti";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import {
  getOrganisationBySlug,
  listOrgPeople,
  listOrgServices,
  listOrgProjects,
  listOrgJobs,
  listOrgGigs,
  listOrgReviews,
  listOrgCredentials,
  listPostsByAuthor,
  listOrganisations,
} from "@/lib/data/network";
import { QueryNotice } from "@/components/states/empty-state";
import { RecordOrgView } from "@/features/company/record-org-view";

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const typed = await getIdentitiBrand(slug);
  if (typed.data && typed.data.passportKind !== "other") {
    redirect(brandPublicHref(typed.data.passportKind, typed.data.slug));
  }
  const org = await getOrganisationBySlug(slug);
  if (org.meta.error) return <QueryNotice configured={org.meta.configured} error={org.meta.error} />;
  if (!org.data) {
    if (!org.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const [people, services, projects, jobs, gigs, reviews, credentials, posts, allOrgs] = await Promise.all([
    listOrgPeople(org.data.id),
    listOrgServices(org.data.id),
    listOrgProjects(org.data.id),
    listOrgJobs(org.data.id),
    listOrgGigs(org.data.id),
    listOrgReviews(org.data.id),
    listOrgCredentials(org.data.id),
    listPostsByAuthor(undefined, org.data.id),
    listOrganisations(),
  ]);
  return (
    <>
      <RecordOrgView organisationId={org.data.id} />
      <CompanyProfileView
      org={org.data}
      people={people.data}
      services={services.data}
      projects={projects.data}
      jobs={jobs.data}
      gigs={gigs.data}
      reviews={reviews.data}
      credentials={credentials.data}
      posts={posts.data}
      similar={allOrgs.data.filter((o) => o.id !== org.data!.id && o.type === org.data!.type)}
    />
    </>
  );
}
