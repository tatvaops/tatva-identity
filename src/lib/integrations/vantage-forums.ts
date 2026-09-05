import { createAdminSupabase } from "@/lib/supabase/admin";
import { existingThreadUrl, newDiscussionUrl, type ForumEntityType, type ForumLink } from "@/lib/domain/forum";
import { createForumContextToken } from "@/lib/domain/forum-token";
import { vantageApiBaseUrl, vantageApiConfigured } from "@/lib/domain/forum-env";

function mapLink(row: {
  entity_type: string;
  entity_id: string;
  brand_id: string | null;
  product_id: string | null;
  forum_hub_id: string | null;
  forum_thread_id: string | null;
  thread_slug: string | null;
  canonical_url: string | null;
  status: string;
}): ForumLink {
  return {
    entityType: row.entity_type as ForumEntityType,
    entityId: row.entity_id,
    brandId: row.brand_id,
    productId: row.product_id,
    forumHubId: row.forum_hub_id,
    forumThreadId: row.forum_thread_id,
    threadSlug: row.thread_slug,
    canonicalUrl: row.canonical_url,
    status: row.status as ForumLink["status"],
  };
}

export async function resolveForumLink(entityType: ForumEntityType, entityId: string): Promise<ForumLink | null> {
  const admin = createAdminSupabase();
  const client = admin;
  if (!client) return null;
  const { data } = await client
    .from("forum_entity_links")
    .select("entity_type, entity_id, brand_id, product_id, forum_hub_id, forum_thread_id, thread_slug, canonical_url, status")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("forum_thread_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data ? mapLink(data) : null;
}

export async function ensureForumHub(input: {
  entityType: ForumEntityType;
  entityId: string;
  brandId: string;
  productId?: string;
  createdBy: string;
}) {
  const existing = await resolveForumLink(input.entityType, input.entityId);
  if (existing) return existing;
  const admin = createAdminSupabase();
  if (!admin) return null;
  const { data } = await admin
    .from("forum_entity_links")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      brand_id: input.brandId,
      product_id: input.productId ?? null,
      status: "pending",
      created_by: input.createdBy,
    })
    .select("entity_type, entity_id, brand_id, product_id, forum_hub_id, forum_thread_id, thread_slug, canonical_url, status")
    .maybeSingle();
  return data ? mapLink(data) : null;
}

export async function startDiscussionRedirect(input: {
  userId: string;
  entityType: ForumEntityType;
  entityId: string;
  brandId: string;
  productId?: string;
  returnUrl: string;
}) {
  await ensureForumHub({
    entityType: input.entityType,
    entityId: input.entityId,
    brandId: input.brandId,
    productId: input.productId,
    createdBy: input.userId,
  });
  const minted = createForumContextToken({
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    brandId: input.brandId,
    productId: input.productId,
    returnUrl: input.returnUrl,
  });
  if ("error" in minted) return minted;
  const admin = createAdminSupabase();
  if (admin) {
    await admin.from("forum_token_jti").insert({ jti: minted.claims.jti, expires_at: new Date(minted.claims.exp * 1000).toISOString() });
  }
  return { url: newDiscussionUrl(minted.token), jti: minted.claims.jti };
}

export function outboundDiscussionUrl(link: ForumLink | null) {
  return existingThreadUrl(link);
}

/** Planned Vantage hub API. Returns null unless both base URL and read token are set. */
export async function fetchVantageHub(entityType: ForumEntityType, entityId: string): Promise<ForumLink | null> {
  if (!vantageApiConfigured()) return null;
  const token = process.env.VANTAGE_FORUM_READ_TOKEN?.trim();
  if (!token) return null;
  try {
    const url = new URL("/forums/hubs", `${vantageApiBaseUrl()}/`);
    url.searchParams.set("entity_type", entityType);
    url.searchParams.set("entity_id", entityId);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      thread_slug?: string;
      canonical_url?: string;
      forum_hub_id?: string;
      forum_thread_id?: string;
      brand_id?: string;
      product_id?: string;
      status?: ForumLink["status"];
    };
    if (!body.thread_slug && !body.canonical_url) return null;
    return {
      entityType,
      entityId,
      brandId: body.brand_id ?? null,
      productId: body.product_id ?? null,
      forumHubId: body.forum_hub_id ?? null,
      forumThreadId: body.forum_thread_id ?? null,
      threadSlug: body.thread_slug ?? null,
      canonicalUrl: body.canonical_url ?? null,
      status: body.status === "active" || body.status === "failed" ? body.status : "pending",
    };
  } catch {
    return null;
  }
}
