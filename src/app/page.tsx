import { MarketingHome } from "@/features/marketing/home";
import { listFeaturedProjects, listGigWorkers, listIdentitiBrands, listProfessionals } from "@/lib/data/identiti";

export default async function HomePage() {
  const [serviceBrands, productBrands, professionals, gigWorkers, projects] = await Promise.all([
    listIdentitiBrands("service_brand"),
    listIdentitiBrands("product_brand"),
    listProfessionals(),
    listGigWorkers(),
    listFeaturedProjects(),
  ]);
  return (
    <MarketingHome
      serviceBrands={serviceBrands.data}
      productBrands={productBrands.data}
      professionals={professionals.data}
      gigWorkers={gigWorkers.data}
      projects={projects}
    />
  );
}
