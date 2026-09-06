import { notFound } from "next/navigation";
import { ProductBrandView } from "@/features/identiti/product-brand-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { getBrandAi, getIdentitiBrand, listBrandPeople, listBrandProducts, listBrandVideos, listIdentitiProjects, listProductProjectUses, recordIdentitiEvent } from "@/lib/data/identiti";
import { listSavedItems } from "@/lib/data/workspace";

export default async function ProductBrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getIdentitiBrand(slug);
  if (brand.meta.error) return <QueryNotice configured={brand.meta.configured} error={brand.meta.error} />;
  if (!brand.data || brand.data.passportKind !== "product_brand") {
    if (!brand.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const [products, projects, uses, ai, saved, videos, people] = await Promise.all([
    listBrandProducts(brand.data.id),
    listIdentitiProjects(brand.data.id),
    listProductProjectUses(brand.data.id),
    getBrandAi(brand.data.id),
    session.userId ? listSavedItems(session.userId) : Promise.resolve({ data: [] }),
    listBrandVideos(brand.data.id),
    listBrandPeople(brand.data.id),
  ]);
  await recordIdentitiEvent("brand_profile_view", "organisation", brand.data.id);
  return (
    <ProductBrandView
      brand={brand.data}
      products={products}
      uses={uses}
      projects={projects}
      videos={videos}
      people={people}
      ai={ai}
      saved={saved.data.some((row) => row.entityKind === "organisation" && row.entityId === brand.data!.id)}
      signedIn={Boolean(session.userId)}
    />
  );
}
