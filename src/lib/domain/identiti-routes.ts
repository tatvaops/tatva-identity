import type { OccupationMode } from "@/lib/types/identity";
import type { ForumEntityType } from "@/lib/domain/forum";
import { appOrigin } from "@/lib/domain/forum-env";
export { appOrigin };

export function personPublicHref(handle: string, occupationMode: OccupationMode) {
  return occupationMode === "blue_collar" ? `/gig-workers/${handle}` : `/professionals/${handle}`;
}

export function brandPublicHref(kind: "service_brand" | "product_brand" | "other", slug: string) {
  if (kind === "service_brand") return `/service-brands/${slug}`;
  if (kind === "product_brand") return `/product-brands/${slug}`;
  return `/companies/${slug}`;
}

export function isForumEntityType(value: string): value is ForumEntityType {
  return value === "service_brand" || value === "product_brand" || value === "product";
}

