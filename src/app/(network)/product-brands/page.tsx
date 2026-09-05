import { BrandDirectory } from "@/features/identiti/brand-directory";
import { listIdentitiBrands } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";

export default async function ProductBrandsPage() {
  const brands = await listIdentitiBrands("product_brand");
  return (
    <>
      <QueryNotice configured={brands.meta.configured} error={brands.meta.error} />
      <BrandDirectory
        title="Product brands"
        body="Materials and interior products organised by application, with proof from real sites."
        brands={brands.data}
        hrefBase="/product-brands"
      />
    </>
  );
}
