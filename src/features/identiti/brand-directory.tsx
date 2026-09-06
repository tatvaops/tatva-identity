import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { PhotoFrame } from "@/components/identity/media-photo";
import { organisationTypeLabel } from "@/lib/domain/org-config";
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
      <h1 className="text-3xl font-black tracking-tight text-[#111a42]">{title}</h1>
      <p className="mt-2 max-w-2xl text-[#747a95]">{body}</p>
      {brands.length === 0 ? (
        <EmptyState className="mt-6" title="No brands yet" body="When a verified brand is published, it appears here." />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {brands.map((brand) => {
            const category = brand.categoryLabel ?? (brand.type ? organisationTypeLabel(brand.type) : null);
            const meta = [
              brand.city,
              brand.averageRating != null ? brand.averageRating.toFixed(1) : null,
              brand.verifiedReviewCount ? `${brand.verifiedReviewCount} reviews` : null,
            ].filter(Boolean);
            return (
              <Link key={brand.id} href={`${hrefBase}/${brand.slug}`}>
                <Card className="overflow-hidden rounded-2xl border-[#e4e6ef] shadow-[0_8px_30px_rgba(25,33,75,.06)]">
                  <PhotoFrame src={brand.coverPath} alt="" className="h-44" />
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {brand.gstVerified || brand.kycVerified ? <Badge variant="verify">TatvaOps verified</Badge> : null}
                      {category ? <Badge variant="outline">{category}</Badge> : null}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{brand.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{brand.tagline || brand.about}</p>
                    {meta.length > 0 ? <p className="mt-3 text-sm">{meta.join(" · ")}</p> : null}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
