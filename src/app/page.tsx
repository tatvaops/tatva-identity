import { MarketingHome } from "@/features/marketing/home";
import { listFeaturedProjects, listGigWorkers, listIdentitiBrands, listProfessionals } from "@/lib/data/identiti";
import { listFeedPosts, listGigs, listJobs } from "@/lib/data/network";

export default async function HomePage() {
  const [serviceBrands, productBrands, professionals, gigWorkers, projects, jobs, gigs, posts] = await Promise.all([
    listIdentitiBrands("service_brand"),
    listIdentitiBrands("product_brand"),
    listProfessionals(),
    listGigWorkers(),
    listFeaturedProjects(),
    listJobs(),
    listGigs(),
    listFeedPosts(),
  ]);
  return (
    <MarketingHome
      serviceBrands={serviceBrands.data}
      productBrands={productBrands.data}
      professionals={professionals.data}
      gigWorkers={gigWorkers.data}
      projects={projects}
      jobs={jobs.data}
      gigs={gigs.data}
      posts={posts.data}
    />
  );
}
