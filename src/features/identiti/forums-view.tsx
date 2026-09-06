import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { existingThreadUrl, vantageForumsOrigin } from "@/lib/domain/forum";
import { IdentitiChip, IdentitiSection } from "@/features/identiti/identiti-chrome";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import type { IdentitiBrand } from "@/lib/data/identiti";

type ForumRow = {
  entity_type: string;
  entity_id: string;
  thread_slug: string | null;
  canonical_url: string | null;
  status: string;
};

export function ForumsHubView({
  brands,
  products,
  links,
  signedIn,
}: {
  brands: IdentitiBrand[];
  products: { id: string; slug: string; name: string; organisation_id: string }[];
  links: ForumRow[];
  signedIn: boolean;
}) {
  const byEntity = new Map(links.map((row) => [`${row.entity_type}:${row.entity_id}`, row]));
  const featured = brands[0] ?? null;
  const featuredType = featured?.passportKind === "product_brand" ? "product_brand" : "service_brand";
  return (
    <div className="space-y-6 pb-14">
      <section className="overflow-hidden rounded-[28px] border border-[#e2e5ef] bg-white p-6 shadow-[0_18px_60px_rgba(20,28,73,.09)] sm:p-8">
        <IdentitiChip active>Open community</IdentitiChip>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111a42]">
          {featured ? `${featured.name} discussions` : "Brand forum"}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#555c78]">
          Ask customers, professionals and the brand about project quality, pricing, timelines and after-sales support.
          Conversations stay on Vantage Forums. IDENTITI only maps a brand or product to an existing thread, or starts a
          signed draft.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild className="rounded-xl px-5 py-3 font-bold">
            <Link href={featured && signedIn ? `/forum/new/${featuredType}/${featured.id}` : signedIn ? "/forums" : "/auth/sign-in?next=/forums"}>
              Start a discussion
            </Link>
          </Button>
          {featured ? (
            <Button asChild variant="outline" className="rounded-xl px-5 py-3 font-bold">
              <Link href={brandPublicHref(featured.passportKind, featured.slug)}>View brand profile</Link>
            </Button>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-[#7a7f99]">
          AI summaries represent community discussion, not TatvaOps endorsement. Open the cited threads before deciding.
          Destination: {vantageForumsOrigin()}/forums
        </p>
      </section>

      <IdentitiSection eyebrow="Community threads" title="Search brand discussions">
        {brands.length === 0 ? (
          <EmptyState title="No brand hubs yet" body="When a service or product brand is published, a forum entry appears here." />
        ) : (
          <div className="space-y-3">
            {brands.map((brand) => {
              const entityType = brand.passportKind === "product_brand" ? "product_brand" : "service_brand";
              const link = byEntity.get(`${entityType}:${brand.id}`);
              const existing = existingThreadUrl(
                link
                  ? {
                      entityType,
                      entityId: brand.id,
                      brandId: brand.id,
                      productId: null,
                      forumHubId: null,
                      forumThreadId: null,
                      threadSlug: link.thread_slug,
                      canonicalUrl: link.canonical_url,
                      status: (link.status as "pending" | "active" | "failed") ?? "pending",
                    }
                  : null,
              );
              return (
                <div key={brand.id} className="flex flex-col gap-4 rounded-2xl border border-[#eceef4] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <IdentitiChip>{entityType.replace("_", " ")}</IdentitiChip>
                      <IdentitiChip active={Boolean(existing)}>{existing ? "Thread mapped" : "Pending mapping"}</IdentitiChip>
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-[#111a42]">{brand.name}</h2>
                    <p className="text-sm text-[#747a95]">{brand.tagline || brand.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="rounded-xl font-bold">
                      <Link href={`/forum/go/${entityType}/${brand.id}`}>{existing ? "Open discussion" : "View mapping"}</Link>
                    </Button>
                    <Button asChild className="rounded-xl font-bold">
                      <Link href={signedIn ? `/forum/new/${entityType}/${brand.id}` : `/auth/sign-in?next=/forums`}>
                        Start a discussion
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
            {products.map((product) => {
              const brand = brands.find((row) => row.id === product.organisation_id);
              const link = byEntity.get(`product:${product.id}`);
              const existing = existingThreadUrl(
                link
                  ? {
                      entityType: "product",
                      entityId: product.id,
                      brandId: brand?.id ?? product.organisation_id,
                      productId: product.id,
                      forumHubId: null,
                      forumThreadId: null,
                      threadSlug: link.thread_slug,
                      canonicalUrl: link.canonical_url,
                      status: (link.status as "pending" | "active" | "failed") ?? "pending",
                    }
                  : null,
              );
              return (
                <div key={product.id} className="flex flex-col gap-4 rounded-2xl border border-[#eceef4] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <IdentitiChip>product</IdentitiChip>
                      <IdentitiChip active={Boolean(existing)}>{existing ? "Thread mapped" : "Pending mapping"}</IdentitiChip>
                    </div>
                    <h2 className="mt-2 text-lg font-bold text-[#111a42]">{product.name}</h2>
                    <p className="text-sm text-[#747a95]">{brand?.name ?? "Product"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="rounded-xl font-bold">
                      <Link href={`/forum/go/product/${product.id}`}>{existing ? "Open discussion" : "View mapping"}</Link>
                    </Button>
                    <Button asChild className="rounded-xl font-bold">
                      <Link href={signedIn ? `/forum/new/product/${product.id}` : `/auth/sign-in?next=/forums`}>
                        Start a discussion
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </IdentitiSection>
    </div>
  );
}
