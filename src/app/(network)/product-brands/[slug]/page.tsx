import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryNotice } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { getBrandAi, getIdentitiBrand, listBrandProducts, listIdentitiProjects, recordIdentitiEvent } from "@/lib/data/identiti";
import { presentAiReview } from "@/lib/domain/ai-review";

export default async function ProductBrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getIdentitiBrand(slug);
  if (brand.meta.error) return <QueryNotice configured={brand.meta.configured} error={brand.meta.error} />;
  if (!brand.data || brand.data.passportKind !== "product_brand") {
    if (!brand.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const [products, projects, ai] = await Promise.all([
    listBrandProducts(brand.data.id),
    listIdentitiProjects(brand.data.id),
    getBrandAi(brand.data.id),
  ]);
  await recordIdentitiEvent("brand_profile_view", "organisation", brand.data.id);
  const families = [...new Set(products.map((product) => product.application_family))];
  const pulse = presentAiReview(ai.review, ai.settings ?? { source: "google_reviews", enabled: true, minimumSourceCount: 5 });
  const discuss = session.userId ? `/forum/new/product_brand/${brand.data.id}` : `/auth/sign-in?next=/product-brands/${slug}`;
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[#0b1f3a] p-8 text-white">
        <div className="flex flex-wrap gap-2">
          {brand.data.gstVerified ? <Badge variant="verify">TatvaOps verified</Badge> : null}
          <Badge variant="outline" className="border-white/30 text-white">{brand.data.categoryLabel ?? "Product brand"}</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{brand.data.name}</h1>
        <p className="mt-3 max-w-3xl text-white/85">{brand.data.about}</p>
        <p className="mt-4 text-sm text-white/70">
          {brand.data.servingRegions ?? brand.data.city}
          {brand.data.foundedYear ? ` · Since ${brand.data.foundedYear}` : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={discuss}>Ask about this brand</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/forum/go/product_brand/${brand.data.id}`}>View brand discussions</Link>
          </Button>
        </div>
      </section>
      {families.map((family) => (
        <section key={family}>
          <h2 className="text-xl font-semibold">{family}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {products
              .filter((product) => product.application_family === family)
              .map((product) => (
                <Card key={product.id} className="p-5">
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <h3 className="mt-1 text-lg font-semibold">
                    <Link href={`/product-brands/${slug}/products/${product.slug}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                  <p className="mt-3 text-sm font-medium">{product.indicative_price_label}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link href={session.userId ? `/forum/new/product/${product.id}` : `/auth/sign-in?next=/product-brands/${slug}`}>
                        Ask about this product
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/forum/go/product/${product.id}`}>View product discussion</Link>
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      ))}
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AI review</p>
        <p className="mt-2 text-sm font-medium">{pulse.sourceLabel}</p>
        {pulse.state === "ready" && pulse.review ? (
          <p className="mt-3 text-sm">{pulse.review.summary}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Not enough eligible sources for a labelled summary yet.</p>
        )}
      </Card>
      {projects.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold">Application proof</h2>
          <p className="mt-1 text-sm text-muted-foreground">Projects where this brand’s products were used.</p>
        </section>
      ) : null}
    </div>
  );
}
