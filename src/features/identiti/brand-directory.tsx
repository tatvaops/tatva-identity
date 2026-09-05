import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { PhotoFrame } from "@/components/identity/media-photo";
import type { IdentitiBrand } from "@/lib/data/identiti";

export function BrandDirectory({
  title,
  body,
  brands,
  hrefBase,
}: {
  title: string;
  body: string;
  brands: IdentitiBrand[];
  hrefBase: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{body}</p>
      {brands.length === 0 ? (
        <EmptyState className="mt-6" title="No brands yet" body="When a verified brand is published, it appears here." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {brands.map((brand) => (
            <Link key={brand.id} href={`${hrefBase}/${brand.slug}`}>
              <Card className="overflow-hidden">
                <PhotoFrame src={brand.coverPath} alt="" className="h-40" />
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {brand.gstVerified || brand.kycVerified ? <Badge variant="verify">TatvaOps verified</Badge> : null}
                    {brand.categoryLabel ? <Badge variant="outline">{brand.categoryLabel}</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{brand.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{brand.tagline || brand.about}</p>
                  <p className="mt-3 text-sm">
                    {brand.city}
                    {brand.averageRating != null ? ` · ${brand.averageRating.toFixed(1)}` : ""}
                    {brand.verifiedReviewCount ? ` · ${brand.verifiedReviewCount} reviews` : ""}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
