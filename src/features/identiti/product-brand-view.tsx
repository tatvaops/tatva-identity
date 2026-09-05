import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoFrame } from "@/components/identity/media-photo";
import { SaveButton } from "@/components/identity/save-button";
import { presentAiReview } from "@/lib/domain/ai-review";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { AiReviewRecord, AiReviewSource } from "@/lib/domain/ai-review";

type Product = {
  id: string;
  slug: string;
  name: string;
  application_family: string;
  category: string | null;
  description: string | null;
  indicative_price_label: string | null;
  photo_url: string | null;
};

type ProductUse = {
  id: string;
  application: string | null;
  location: string | null;
  endorsement: string | null;
  product: Product | null;
  project: IdentitiProject | null;
};

export function ProductBrandView({
  brand,
  products,
  uses,
  projects,
  ai,
  saved,
  signedIn,
}: {
  brand: IdentitiBrand;
  products: Product[];
  uses: ProductUse[];
  projects: IdentitiProject[];
  ai: { settings: { source: AiReviewSource; enabled: boolean; minimumSourceCount: number } | null; review: AiReviewRecord | null };
  saved: boolean;
  signedIn: boolean;
}) {
  const families = [...new Set(products.map((product) => product.application_family))];
  const pulse = presentAiReview(ai.review, ai.settings ?? { source: "google_reviews", enabled: true, minimumSourceCount: 5 });
  const proof = uses.filter((row) => row.project);
  const discuss = signedIn ? `/forum/new/product_brand/${brand.id}` : `/auth/sign-in?next=/product-brands/${brand.slug}`;
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-[#0b1f3a] text-white">
        <PhotoFrame src={brand.coverPath} alt="" className="h-56 md:h-72" />
        <div className="space-y-4 p-8">
          <div className="flex flex-wrap gap-2">
            {brand.gstVerified ? <Badge variant="verify">TatvaOps verified</Badge> : null}
            <Badge variant="outline" className="border-white/30 text-white">{brand.categoryLabel ?? "Product brand"}</Badge>
          </div>
          <h1 className="text-4xl font-semibold">{brand.name}</h1>
          <p className="max-w-3xl text-white/85">{brand.about}</p>
          <div className="flex flex-wrap gap-3">
            {signedIn ? <SaveButton kind="organisation" id={brand.id} saved={saved} /> : (
              <Button asChild variant="secondary">
                <Link href={`/auth/sign-in?next=/product-brands/${brand.slug}`}>Save brand</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={discuss}>Ask about this brand</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10">
              <Link href={`/forum/go/product_brand/${brand.id}`}>View brand discussions</Link>
            </Button>
          </div>
        </div>
      </section>
      {families.map((family) => (
        <section key={family}>
          <h2 className="text-xl font-semibold">{family}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {products
              .filter((product) => product.application_family === family)
              .map((product) => (
                <Link key={product.id} href={`/product-brands/${brand.slug}/products/${product.slug}`}>
                  <Card className="overflow-hidden">
                    <PhotoFrame src={product.photo_url} alt="" className="h-40" />
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                      <p className="mt-3 text-sm font-medium">{product.indicative_price_label}</p>
                    </div>
                  </Card>
                </Link>
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
      {(proof.length > 0 || projects.length > 0) ? (
        <section>
          <h2 className="text-xl font-semibold">Application proof</h2>
          <p className="mt-1 text-sm text-muted-foreground">Projects where this brand’s products were used.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {proof.length
              ? proof.map((row) => (
                  <Link key={row.id} href={`/projects/${row.project!.slug}`}>
                    <Card className="overflow-hidden">
                      <PhotoFrame src={row.project!.coverImageUrl} alt="" className="h-40" />
                      <div className="p-5">
                        <p className="text-xs text-muted-foreground">{row.product?.name ?? "Product"}</p>
                        <h3 className="text-lg font-semibold">{row.project!.name}</h3>
                        <p className="text-sm text-muted-foreground">{row.application || row.location || row.project!.city}</p>
                      </div>
                    </Card>
                  </Link>
                ))
              : projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.slug}`}>
                    <Card className="overflow-hidden">
                      <PhotoFrame src={project.coverImageUrl} alt="" className="h-40" />
                      <div className="p-5">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.city}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
