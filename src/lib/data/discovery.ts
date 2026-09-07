import { listIdentitiBrands, listFeaturedProjects } from "@/lib/data/identiti";
import {
  listAllServices,
  listFeedPosts,
  listGigs,
  listJobs,
  listOrganisations,
  listPostsByAuthor,
  listPublicProfiles,
  searchNetwork,
} from "@/lib/data/network";
import { brandPublicHref, personPublicHref } from "@/lib/domain/identiti-routes";

export { listFeedPosts, listPostsByAuthor, searchNetwork };

export type DiscoverHit = {
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
};

export type SearchDiscovery = {
  people: DiscoverHit[];
  companies: DiscoverHit[];
  serviceBrands: DiscoverHit[];
  productBrands: DiscoverHit[];
  projects: DiscoverHit[];
  jobs: DiscoverHit[];
  gigs: DiscoverHit[];
  services: DiscoverHit[];
};

export async function getSearchDiscovery(): Promise<SearchDiscovery> {
  const [people, companies, serviceBrands, productBrands, projects, jobs, gigs, services] = await Promise.all([
    listPublicProfiles({}, { pageSize: 4 }),
    listOrganisations(undefined, undefined, { pageSize: 4 }),
    listIdentitiBrands("service_brand"),
    listIdentitiBrands("product_brand"),
    listFeaturedProjects(),
    listJobs({}, { pageSize: 3 }),
    listGigs({}, { pageSize: 3 }),
    listAllServices(),
  ]);
  return {
    people: people.data.slice(0, 4).map((person) => ({
      id: person.id,
      href: personPublicHref(person.handle, person.occupationMode),
      title: person.fullName,
      subtitle: person.headline || person.city,
    })),
    companies: companies.data.slice(0, 4).map((org) => ({
      id: org.id,
      href: brandPublicHref(org.passportKind ?? "other", org.slug),
      title: org.name,
      subtitle: org.city || org.tagline,
    })),
    serviceBrands: serviceBrands.data.slice(0, 4).map((brand) => ({
      id: brand.id,
      href: brandPublicHref(brand.passportKind, brand.slug),
      title: brand.name,
      subtitle: brand.tagline || brand.city,
    })),
    productBrands: productBrands.data.slice(0, 4).map((brand) => ({
      id: brand.id,
      href: brandPublicHref(brand.passportKind, brand.slug),
      title: brand.name,
      subtitle: brand.tagline || brand.city,
    })),
    projects: projects.slice(0, 4).map((project) => ({
      id: project.id,
      href: `/projects/${project.slug}`,
      title: project.name,
      subtitle: [project.city, project.valueLabel].filter(Boolean).join(" · ") || null,
    })),
    jobs: jobs.data.slice(0, 3).map((job) => ({
      id: job.id,
      href: `/jobs/${job.id}`,
      title: job.title,
      subtitle: [job.city, job.employmentType.replaceAll("_", " ")].filter(Boolean).join(" · ") || null,
    })),
    gigs: gigs.data.slice(0, 3).map((gig) => ({
      id: gig.id,
      href: `/gigs/${gig.id}`,
      title: gig.title,
      subtitle: [gig.trade, gig.siteName, gig.payLabel].filter(Boolean).join(" · ") || null,
    })),
    services: services.data.slice(0, 3).map((service) => ({
      id: service.id,
      href: service.organisationSlug
        ? brandPublicHref(service.passportKind ?? "other", service.organisationSlug)
        : "/services",
      title: service.name,
      subtitle: service.organisationName || service.locations.join(" · ") || null,
    })),
  };
}
