import { BrandDirectory } from "@/features/identiti/brand-directory";
import { listIdentitiBrands } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";

export default async function ServiceBrandsPage() {
  const brands = await listIdentitiBrands("service_brand");
  return (
    <>
      <QueryNotice configured={brands.meta.configured} error={brands.meta.error} />
      <BrandDirectory
        title="Service brands"
        body="Verified contractors, interior teams and allied services. Judge them by delivered work, not a brochure."
        brands={brands.data}
        hrefBase="/service-brands"
      />
    </>
  );
}
