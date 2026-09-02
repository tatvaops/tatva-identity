import { notFound } from "next/navigation";
import { CompanyProfileView } from "@/features/company/company-profile";
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

const tabs = ["about", "services", "projects", "people", "jobs", "posts", "credentials", "reviews"] as const;

export default async function OrgTabPage({ params }: { params: Promise<{ slug: string; tab: string }> }) {
  const { slug, tab } = await params;
  const org = await getOrganisationBySlug(slug);
  if (!org.data || !tabs.includes(tab as (typeof tabs)[number])) notFound();
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
    <CompanyProfileView
      org={org.data}
      tab={tab}
      people={people.data}
      services={services.data}
      projects={projects.data}
      jobs={jobs.data}
      gigs={gigs.data}
      reviews={reviews.data}
      credentials={credentials.data}
      posts={posts.data}
      similar={allOrgs.data.filter((o) => o.id !== org.data!.id)}
    />
  );
}
