import { MarketingHome } from "@/features/marketing/home";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { listFeaturedProjects, listGigWorkers, listIdentitiBrands, listProfessionals } from "@/lib/data/identiti";
import { listFeedPosts, listGigs, listJobs } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";

export default async function HomePage() {
  const [session, serviceBrands, productBrands, professionals, gigWorkers, projects, jobs, gigs, posts] = await Promise.all([
    getAuthContext(),
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
    <SessionProvider value={session}>
      <AppShell bleed>
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
      </AppShell>
    </SessionProvider>
  );
}
