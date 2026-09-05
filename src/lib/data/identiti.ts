import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthContext, itemFail, itemOk, listFail, listOk, unconfiguredItem, unconfiguredList, type ItemResult, type ListResult } from "@/lib/data/query";
import { mapOrganisation, mapPublicProfile, ORGANISATION_GRANTED_COLUMNS, ORGANISATION_SAFE_COLUMNS } from "@/lib/data/mappers";
import { trackEvent } from "@/lib/actions/notify";
import type { Organisation, PublicProfile } from "@/lib/types/identity";
import type { AiReviewRecord, AiReviewSource } from "@/lib/domain/ai-review";
import type { ForumEntityType } from "@/lib/domain/forum";

export type IdentitiBrand = Organisation & {
  passportKind: "service_brand" | "product_brand" | "other";
  legalEntityName: string | null;
  gstin: string | null;
  gstVerified: boolean;
  kycVerified: boolean;
  typicalValueMinInr: number | null;
  typicalValueMaxInr: number | null;
  deliverySlots: number | null;
  designLeadWeeks: number | null;
  activeCities: number | null;
  designCapability: boolean;
  executionCapability: boolean;
  capabilityChips: string[];
  categoryLabel: string | null;
  servingRegions: string | null;
  averageRating: number | null;
  verifiedReviewCount: number;
};

export type IdentitiProject = {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  city: string | null;
  sizeLabel: string | null;
  valueLabel: string | null;
  durationLabel: string | null;
  youtubeUrl: string | null;
  youtubeDuration: string | null;
  coverImageUrl: string | null;
  summary: string | null;
  qcNotes: string | null;
  testimonial: string | null;
  customerVerified: boolean;
  verified: boolean;
};

function mapBrand(row: Record<string, unknown>, viewerId?: string | null): IdentitiBrand {
  const base = mapOrganisation(row as Parameters<typeof mapOrganisation>[0], viewerId);
  return {
    ...base,
    passportKind: base.passportKind,
    legalEntityName: (row.legal_entity_name as string | null) ?? null,
    gstin: null,
    gstVerified: Boolean(row.gst_verified),
    kycVerified: Boolean(row.kyc_verified),
    typicalValueMinInr: (row.typical_value_min_inr as number | null) ?? null,
    typicalValueMaxInr: (row.typical_value_max_inr as number | null) ?? null,
    deliverySlots: (row.delivery_slots as number | null) ?? null,
    designLeadWeeks: (row.design_lead_weeks as number | null) ?? null,
    activeCities: (row.active_cities as number | null) ?? null,
    designCapability: Boolean(row.design_capability),
    executionCapability: Boolean(row.execution_capability),
    capabilityChips: (row.capability_chips as string[]) ?? [],
    categoryLabel: (row.category_label as string | null) ?? null,
    servingRegions: (row.serving_regions as string | null) ?? null,
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    verifiedReviewCount: Number(row.verified_review_count ?? 0),
  };
}

export async function listIdentitiBrands(kind: "service_brand" | "product_brand"): Promise<ListResult<IdentitiBrand>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const session = await getAuthContext();
  const full = await supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS).order("name");
  const fallback = full.error ? await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).order("name") : null;
  if (full.error && fallback?.error) return listFail();
  const rows = (full.error ? fallback?.data : full.data) ?? [];
  return listOk(rows.map((row) => mapBrand(row, session.userId)).filter((brand) => brand.passportKind === kind));
}

export async function getIdentitiBrand(slug: string): Promise<ItemResult<IdentitiBrand>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const session = await getAuthContext();
  const full = await supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS).eq("slug", slug).maybeSingle();
  const fallback = full.error ? await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).eq("slug", slug).maybeSingle() : null;
  if (full.error && fallback?.error) return itemFail();
  const row = full.error ? fallback?.data : full.data;
  return itemOk(row ? mapBrand(row, session.userId) : null);
}

function mapProject(row: {
  id: string;
  slug: string;
  name: string;
  project_type: string | null;
  city: string | null;
  size_label: string | null;
  value_label: string | null;
  duration_label: string | null;
  youtube_url: string | null;
  youtube_duration: string | null;
  cover_image_url: string | null;
  summary: string | null;
  qc_notes: string | null;
  testimonial: string | null;
  customer_verified: boolean | null;
  verified: boolean | null;
}): IdentitiProject {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.project_type,
    city: row.city,
    sizeLabel: row.size_label,
    valueLabel: row.value_label,
    durationLabel: row.duration_label,
    youtubeUrl: row.youtube_url,
    youtubeDuration: row.youtube_duration,
    coverImageUrl: row.cover_image_url,
    summary: row.summary,
    qcNotes: row.qc_notes,
    testimonial: row.testimonial,
    customerVerified: Boolean(row.customer_verified),
    verified: Boolean(row.verified),
  };
}

const PROJECT_COLUMNS =
  "id, slug, name, project_type, city, size_label, value_label, duration_label, youtube_url, youtube_duration, cover_image_url, summary, qc_notes, testimonial, customer_verified, verified";

export async function listFeaturedProjects(): Promise<IdentitiProject[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("network_projects")
    .select(PROJECT_COLUMNS)
    .not("cover_image_url", "is", null)
    .order("name")
    .limit(8);
  return (data ?? []).map(mapProject);
}

export async function listIdentitiProjects(organisationId: string): Promise<IdentitiProject[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("network_projects")
    .select(PROJECT_COLUMNS)
    .or(`client_organisation_id.eq.${organisationId},main_contractor_id.eq.${organisationId}`);
  return (data ?? []).map(mapProject);
}

export async function listIdentitiProjectsForProfile(profileId: string): Promise<IdentitiProject[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data: links } = await supabase.from("project_contributors").select("project_id").eq("profile_id", profileId).eq("opted_in", true);
  const ids = (links ?? []).map((row) => row.project_id).filter(Boolean);
  if (ids.length === 0) return [];
  const { data } = await supabase.from("network_projects").select(PROJECT_COLUMNS).in("id", ids);
  return (data ?? []).map(mapProject);
}

export async function getBrandPerformance(organisationId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("organisation_performance").select("*").eq("organisation_id", organisationId).maybeSingle();
  return data;
}

export async function listBrandStrengths(organisationId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("organisation_strengths").select("id, title, metric_label, body").eq("organisation_id", organisationId);
  return data ?? [];
}

export async function listBrandVideos(organisationId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("organisation_videos").select("id, kind, title, youtube_url, duration_label").eq("organisation_id", organisationId);
  return data ?? [];
}

export async function getBrandAi(organisationId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return { settings: null, review: null as AiReviewRecord | null };
  const [settings, review] = await Promise.all([
    supabase.from("organisation_ai_review_settings").select("*").eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("organisation_ai_reviews").select("*").eq("organisation_id", organisationId).maybeSingle(),
  ]);
  return {
    settings: settings.data
      ? {
          source: settings.data.ai_review_source as AiReviewSource,
          enabled: Boolean(settings.data.ai_review_enabled),
          minimumSourceCount: Number(settings.data.minimum_source_count ?? 5),
        }
      : null,
    review: review.data
      ? {
          sourceKind: review.data.source_kind as AiReviewSource,
          sourceLabel: review.data.source_label,
          overallSentimentPct: review.data.overall_sentiment_pct != null ? Number(review.data.overall_sentiment_pct) : null,
          strengths: review.data.strengths ?? [],
          concerns: review.data.concerns ?? [],
          themes: review.data.themes ?? [],
          brandResponseRate: review.data.brand_response_rate != null ? Number(review.data.brand_response_rate) : null,
          sourceCount: Number(review.data.source_count ?? 0),
          dateRangeLabel: review.data.date_range_label,
          confidenceLabel: review.data.confidence_label,
          summary: review.data.summary,
          sourceHref: review.data.source_href,
          generatedAt: review.data.generated_at,
        }
      : null,
  };
}

export async function listBrandProducts(organisationId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("brand_products").select("*").eq("organisation_id", organisationId).order("name");
  return data ?? [];
}

export async function getBrandProduct(organisationId: string, productSlug: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("brand_products").select("*").eq("organisation_id", organisationId).eq("slug", productSlug).maybeSingle();
  return data;
}

export async function listProfessionals() {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList<PublicProfile>();
  const { data, error } = await supabase.from("public_profiles").select("*").in("occupation_mode", ["white_collar", "freelancer"]).order("full_name");
  if (error) return listFail<PublicProfile>();
  return listOk((data ?? []).map(mapPublicProfile));
}

export async function listGigWorkers() {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList<PublicProfile>();
  const { data, error } = await supabase.from("public_profiles").select("*").in("occupation_mode", ["blue_collar", "contractor"]).order("full_name");
  if (error) return listFail<PublicProfile>();
  return listOk((data ?? []).map(mapPublicProfile));
}

export async function listBrandPeople(organisationId: string): Promise<PublicProfile[]> {
  const projects = await listIdentitiProjects(organisationId);
  const ids = projects.map((project) => project.id);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data: links } = await supabase.from("project_contributors").select("profile_id").in("project_id", ids).eq("opted_in", true);
  const profileIds = [...new Set((links ?? []).map((row) => row.profile_id).filter(Boolean))];
  if (profileIds.length === 0) return [];
  const { data } = await supabase.from("public_profiles").select("*").in("id", profileIds);
  return (data ?? []).map(mapPublicProfile);
}

export async function listProductUsesForProject(projectId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("product_project_uses")
    .select("id, application, location, endorsement, verified, product_id, project_id")
    .eq("project_id", projectId);
  const productIds = [...new Set((data ?? []).map((row) => row.product_id).filter(Boolean))];
  if (productIds.length === 0) return [];
  const products = await supabase.from("brand_products").select("*").in("id", productIds);
  const orgIds = [...new Set((products.data ?? []).map((row) => row.organisation_id).filter(Boolean))];
  const brands = orgIds.length
    ? await Promise.all(orgIds.map((id) => getIdentitiBrandById(id)))
    : [];
  const brandById = new Map(brands.filter(Boolean).map((brand) => [brand!.id, brand!]));
  const productById = new Map((products.data ?? []).map((product) => [product.id, product]));
  return (data ?? []).map((row) => {
    const product = productById.get(row.product_id) ?? null;
    const brand = product ? brandById.get(product.organisation_id) ?? null : null;
    return {
      id: row.id,
      application: row.application as string | null,
      location: row.location as string | null,
      endorsement: row.endorsement as string | null,
      verified: Boolean(row.verified),
      product,
      brand,
    };
  });
}

export async function listAllBrandProducts() {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("brand_products").select("*").order("name");
  return data ?? [];
}

export async function listProductProjectUses(organisationId: string) {
  const products = await listBrandProducts(organisationId);
  const ids = products.map((product) => product.id);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("product_project_uses")
    .select("id, application, location, endorsement, verified, product_id, project_id")
    .in("product_id", ids);
  const projectIds = [...new Set((data ?? []).map((row) => row.project_id).filter(Boolean))];
  const projects = projectIds.length ? await supabase.from("network_projects").select(PROJECT_COLUMNS).in("id", projectIds) : { data: [] };
  const byId = new Map((projects.data ?? []).map((row) => [row.id, mapProject(row)]));
  const productById = new Map(products.map((product) => [product.id, product]));
  return (data ?? []).map((row) => ({
    id: row.id,
    application: row.application as string | null,
    location: row.location as string | null,
    endorsement: row.endorsement as string | null,
    verified: Boolean(row.verified),
    product: productById.get(row.product_id) ?? null,
    project: row.project_id ? byId.get(row.project_id) ?? null : null,
  }));
}

export async function listPortfolio(profileId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("work_portfolio_items").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
  const projectIds = [...new Set((data ?? []).map((row) => row.project_id).filter(Boolean))];
  const projects = projectIds.length
    ? await supabase.from("network_projects").select("id, slug, name").in("id", projectIds)
    : { data: [] };
  const byId = new Map((projects.data ?? []).map((row) => [row.id, row]));
  return (data ?? []).map((row) => ({
    ...row,
    project: row.project_id ? byId.get(row.project_id) ?? null : null,
  }));
}

export async function listSupervisorReviews(profileId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("supervisor_reviews").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function listSkillFacts(profileId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("skill_passport_facts").select("*").eq("profile_id", profileId);
  return data ?? [];
}

export async function recordIdentitiEvent(name: string, kind: string, id: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return;
  await trackEvent(supabase, name, kind, id);
}

export function forumEntityForBrand(kind: IdentitiBrand["passportKind"]): ForumEntityType | null {
  if (kind === "service_brand" || kind === "product_brand") return kind;
  return null;
}

export async function getIdentitiBrandById(id: string): Promise<IdentitiBrand | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const session = await getAuthContext();
  const full = await supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS).eq("id", id).maybeSingle();
  const fallback = full.error ? await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).eq("id", id).maybeSingle() : null;
  const row = full.error ? fallback?.data : full.data;
  return row ? mapBrand(row, session.userId) : null;
}

export async function getBrandProductById(productId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("brand_products").select("*").eq("id", productId).maybeSingle();
  return data;
}

export async function listForumLinks() {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("forum_entity_links")
    .select("entity_type, entity_id, brand_id, product_id, forum_hub_id, forum_thread_id, thread_slug, canonical_url, status")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function resolveForumTarget(entityType: ForumEntityType, entityId: string) {
  if (entityType === "product") {
    const product = await getBrandProductById(entityId);
    if (!product) return null;
    const brand = await getIdentitiBrandById(product.organisation_id);
    if (!brand) return null;
    return {
      brand,
      brandId: brand.id,
      productId: product.id as string,
      returnPath: `/product-brands/${brand.slug}/products/${product.slug}`,
    };
  }
  const brand = await getIdentitiBrandById(entityId);
  if (!brand || forumEntityForBrand(brand.passportKind) !== entityType) return null;
  return {
    brand,
    brandId: brand.id,
    productId: undefined as string | undefined,
    returnPath: brand.passportKind === "product_brand" ? `/product-brands/${brand.slug}` : `/service-brands/${brand.slug}`,
  };
}
