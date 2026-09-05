import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QueryNotice } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { getBrandProduct, getIdentitiBrand, recordIdentitiEvent } from "@/lib/data/identiti";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const brand = await getIdentitiBrand(slug);
  if (brand.meta.error) return <QueryNotice configured={brand.meta.configured} error={brand.meta.error} />;
  if (!brand.data || brand.data.passportKind !== "product_brand") {
    if (!brand.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const product = await getBrandProduct(brand.data.id, productId);
  if (!product) notFound();
  const session = await getAuthContext();
  await recordIdentitiEvent("product_profile_view", "product", product.id);
  const discuss = session.userId
    ? `/forum/new/product/${product.id}`
    : `/auth/sign-in?next=/product-brands/${slug}/products/${productId}`;
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-[#0b1f3a] p-8 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">{brand.data.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="border-white/30 text-white">{product.application_family}</Badge>
          {product.category ? <Badge variant="outline" className="border-white/30 text-white">{product.category}</Badge> : null}
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{product.name}</h1>
        <p className="mt-3 max-w-3xl text-white/85">{product.description}</p>
        <p className="mt-4 text-sm text-white/70">{product.indicative_price_label}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={discuss}>Ask about this product</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/forum/go/product/${product.id}`}>View product discussion</Link>
          </Button>
        </div>
      </section>
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Specification</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {product.warranty_label ? `Warranty: ${product.warranty_label}. ` : ""}
          {product.unit_label ? `Sold as ${product.unit_label}. ` : ""}
          Availability is labelled as {product.availability.replaceAll("_", " ")}.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href={`/product-brands/${slug}`}>Back to brand</Link>
        </Button>
      </Card>
    </div>
  );
}
