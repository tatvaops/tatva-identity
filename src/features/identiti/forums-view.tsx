import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { existingThreadUrl, vantageForumsOrigin } from "@/lib/domain/forum";
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
  links,
  signedIn,
}: {
  brands: IdentitiBrand[];
  links: ForumRow[];
  signedIn: boolean;
}) {
  const byEntity = new Map(links.map((row) => [`${row.entity_type}:${row.entity_id}`, row]));
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Brand forum</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Discussions live on Vantage Forums. IDENTITI only maps a brand or product to an existing thread, or starts a
        signed draft. Nothing is published from here.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Outbound destination: {vantageForumsOrigin()}/forums
      </p>
      {brands.length === 0 ? (
        <EmptyState className="mt-6" title="No brand hubs yet" body="When a service or product brand is published, a forum entry appears here." />
      ) : (
        <div className="mt-6 grid gap-4">
          {brands.map((brand) => {
            const entityType = brand.passportKind === "product_brand" ? "product_brand" : "service_brand";
            const link = byEntity.get(`${entityType}:${brand.id}`);
            const existing = existingThreadUrl(
              link
                ? {
                    entityType: entityType,
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
              <Card key={brand.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{entityType.replace("_", " ")}</Badge>
                    <Badge variant={existing ? "success" : "warning"}>{existing ? "Thread mapped" : "Pending mapping"}</Badge>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{brand.name}</h2>
                  <p className="text-sm text-muted-foreground">{brand.tagline || brand.city}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/forum/go/${entityType}/${brand.id}`}>{existing ? "Open discussion" : "View mapping"}</Link>
                  </Button>
                  <Button asChild>
                    <Link href={signedIn ? `/forum/new/${entityType}/${brand.id}` : `/auth/sign-in?next=/forums`}>
                      Start a discussion
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
