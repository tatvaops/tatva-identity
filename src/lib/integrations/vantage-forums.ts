import { createAdminSupabase } from "@/lib/supabase/admin";
import { existingThreadUrl, newDiscussionUrl, type ForumEntityType, type ForumLink } from "@/lib/domain/forum";
import { createForumContextToken } from "@/lib/domain/forum-token";

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
      status: process.env.VANTAGE_API_BASE_URL ? "pending" : "pending",
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
