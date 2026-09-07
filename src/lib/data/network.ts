import { personPublicHref } from "@/lib/domain/identiti-routes";
import { trackEvent } from "@/lib/actions/notify";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  mapCert,
  mapExperience,
  mapGig,
  mapJob,
  mapOrganisation,
  mapPost,
  mapProject,
  mapPublicProfile,
  mapSkill,
  inferPassportKind,
  ORGANISATION_GRANTED_COLUMNS,
  ORGANISATION_SAFE_COLUMNS,
} from "@/lib/data/mappers";
import {
  itemFail,
  itemOk,
  listFail,
  listOk,
  pageRange,
  unconfiguredItem,
  unconfiguredList,
  getAuthContext,
  type ItemResult,
  type ListResult,
} from "@/lib/data/query";
import { rankGigs, rankJobs, rankOrganisations, rankPeople, sortGigsNearby } from "@/lib/domain/search-rank";
import type {
  ConversationSummary,
  Experience,
  GigPost,
  JobPost,
  ListOptions,
  MessageRow,
  NetworkProject,
  NotificationRow,
  OrgCredential,
  OrgService,
  Organisation,
  Post,
  PostComment,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
  ReviewRow,
  SkillCatalogItem,
} from "@/lib/types/identity";

export type PeopleFilters = {
  query?: string;
  city?: string;
  availability?: string;
  organisationId?: string;
  skill?: string;
  trade?: string;
};

export type ConnectionState = "connect" | "pending" | "incoming" | "connected";

function sanitizeFilter(value?: string) {
  if (!value) return "";
  return value.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

async function profileIdsForSkill(supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>, needle: string) {
  const [{ data: catalog }, { data: facts }] = await Promise.all([
    supabase.from("skills").select("id").or(`name.ilike.%${needle}%,category.ilike.%${needle}%`),
    supabase.from("skill_passport_facts").select("profile_id").ilike("skill_name", `%${needle}%`),
  ]);
  const skillIds = (catalog ?? []).map((row) => row.id as string);
  const fromFacts = (facts ?? []).map((row) => row.profile_id as string);
  if (skillIds.length === 0) return [...new Set(fromFacts)];
  const { data: linked } = await supabase.from("profile_skills").select("profile_id").in("skill_id", skillIds.slice(0, 400));
  return [...new Set([...(linked ?? []).map((row) => row.profile_id as string), ...fromFacts])];
}

export async function listPublicProfiles(
  filters: PeopleFilters = {},
  options: ListOptions = {},
): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const query = sanitizeFilter(filters.query);
  const city = sanitizeFilter(filters.city);
  const skill = sanitizeFilter(filters.skill || filters.trade);
  let q = supabase.from("public_profiles").select("*", { count: "exact" }).order("full_name");
  if (city) q = q.ilike("city", `%${city}%`);
  if (filters.availability) q = q.eq("availability_status", filters.availability);
  if (filters.organisationId) q = q.eq("current_organisation_id", filters.organisationId);
  if (query) {
    q = q.or(`full_name.ilike.%${query}%,headline.ilike.%${query}%,about.ilike.%${query}%`);
  }
  if (skill) {
    const ids = await profileIdsForSkill(supabase, skill);
    if (ids.length === 0) return listOk([], 0);
    q = q.in("id", ids.slice(0, 400));
  }
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error, count } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapPublicProfile), count ?? undefined);
}

export async function getProfileByHandle(handle: string): Promise<ItemResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("public_profiles").select("*").eq("handle", handle).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapPublicProfile(data) : null);
}

export async function getProfileById(id: string): Promise<ItemResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("public_profiles").select("*").eq("id", id).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapPublicProfile(data) : null);
}

export async function getProfilesByIds(ids: string[]): Promise<PublicProfile[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("public_profiles").select("*").in("id", unique);
  return (data ?? []).map(mapPublicProfile);
}

export async function listOrganisations(
  query?: string,
  type?: string,
  options: ListOptions = {},
): Promise<ListResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const ctx = await getAuthContext();
  let q = supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS, { count: "exact" }).order("name");
  if (query) q = q.or(`name.ilike.%${query}%,tagline.ilike.%${query}%,industry.ilike.%${query}%`);
  if (type) q = q.eq("organisation_type", type);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const full = await q;
  if (!full.error) return listOk((full.data ?? []).map((row) => mapOrganisation(row, ctx.userId)), full.count ?? undefined);
  let fallback = supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS, { count: "exact" }).order("name");
  if (query) fallback = fallback.or(`name.ilike.%${query}%,tagline.ilike.%${query}%,industry.ilike.%${query}%`);
  if (type) fallback = fallback.eq("organisation_type", type);
  if (range) fallback = fallback.range(range.from, range.to);
  const retry = await fallback;
  if (retry.error) return listFail(retry.error.message);
  return listOk((retry.data ?? []).map((row) => mapOrganisation(row, ctx.userId)), retry.count ?? undefined);
}

export async function getOrganisationBySlug(slug: string): Promise<ItemResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const ctx = await getAuthContext();
  const full = await supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS).eq("slug", slug).maybeSingle();
  const fallback = full.error ? await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).eq("slug", slug).maybeSingle() : null;
  if (full.error && fallback?.error) return itemFail(fallback.error.message);
  const row = full.error ? fallback?.data : full.data;
  return itemOk(row ? mapOrganisation(row, ctx.userId) : null);
}

export async function getOrganisationById(id: string): Promise<ItemResult<Organisation>> {
  const rows = await getOrganisationsByIds([id]);
  return itemOk(rows[0] ?? null);
}

export async function getOrganisationsByIds(ids: string[]): Promise<Organisation[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const ctx = await getAuthContext();
  const full = await supabase.from("organisations").select(ORGANISATION_GRANTED_COLUMNS).in("id", unique);
  if (!full.error) return (full.data ?? []).map((row) => mapOrganisation(row, ctx.userId));
  const fallback = await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).in("id", unique);
  if (fallback.error) return [];
  return (fallback.data ?? []).map((row) => mapOrganisation(row, ctx.userId));
}

export async function listProjects(): Promise<ListResult<NetworkProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("network_projects").select("*").order("name");
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapProject));
}

export async function getProjectBySlug(slug: string): Promise<ItemResult<NetworkProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("network_projects").select("*").eq("slug", slug).maybeSingle();
  if (error) return itemFail(error.message);
  if (data) return itemOk(mapProject(data));
  const byId = await supabase.from("network_projects").select("*").eq("id", slug).maybeSingle();
  if (byId.error) return itemFail(byId.error.message);
  return itemOk(byId.data ? mapProject(byId.data) : null);
}

export async function listJobs(
  filters: { city?: string; employmentType?: string } = {},
  options: ListOptions = {},
): Promise<ListResult<JobPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("job_posts").select("*", { count: "exact" }).is("closed_at", null).order("created_at", { ascending: false });
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.employmentType) q = q.eq("employment_type", filters.employmentType);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error, count } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapJob), count ?? undefined);
}

export async function getJob(id: string): Promise<ItemResult<JobPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("job_posts").select("*").eq("id", id).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapJob(data) : null);
}

export async function listGigs(
  filters: { city?: string; trade?: string } = {},
  options: ListOptions = {},
): Promise<ListResult<GigPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("gig_posts").select("*", { count: "exact" }).is("closed_at", null).order("created_at", { ascending: false });
  if (filters.trade) q = q.ilike("trade", `%${filters.trade}%`);
  if (filters.city) q = q.or(`site_name.ilike.%${filters.city}%,trade.ilike.%${filters.city}%`);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error, count } = await q;
  if (error) return listFail(error.message);
  return listOk(sortGigsNearby((data ?? []).map(mapGig)), count ?? undefined);
}

export async function getGig(id: string): Promise<ItemResult<GigPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("gig_posts").select("*").eq("id", id).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapGig(data) : null);
}

export async function listFeedPosts(options: ListOptions & { viewerId?: string | null; projectId?: string } = {}): Promise<ListResult<Post>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const range = pageRange(options, 20);
  let q = supabase
    .from("posts")
    .select("*, post_media(storage_path)", { count: "exact" })
    .is("hidden_at", null)
    .order("created_at", { ascending: false });
  if (options.projectId) q = q.eq("linked_project_id", options.projectId);
  if (range) q = q.range(range.from, range.to);
  const { data, error, count } = await q;
  if (error) return listFail(error.message);
  let posts = (data ?? []).map(mapPost);
  if (options.viewerId) {
    const hidden = await hiddenAuthorIds(options.viewerId);
    posts = posts.filter((post) => !post.authorProfileId || !hidden.has(post.authorProfileId));
  }
  return listOk(posts, count ?? undefined);
}

async function hiddenAuthorIds(viewerId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return new Set<string>();
  const [{ data: blocked }, { data: muted }, { data: blockedBy }] = await Promise.all([
    supabase.from("profile_blocks").select("blocked_id").eq("blocker_id", viewerId),
    supabase.from("profile_mutes").select("muted_id").eq("muter_id", viewerId),
    supabase.from("profile_blocks").select("blocker_id").eq("blocked_id", viewerId),
  ]);
  return new Set([
    ...(blocked ?? []).map((row) => row.blocked_id),
    ...(muted ?? []).map((row) => row.muted_id),
    ...(blockedBy ?? []).map((row) => row.blocker_id),
  ]);
}

export async function listPostReactionState(postIds: string[], viewerId?: string | null) {
  const supabase = await createServerSupabase();
  const empty = { counts: new Map<string, number>(), liked: new Set<string>() };
  if (!supabase || postIds.length === 0) return empty;
  const { data } = await supabase.from("post_reactions").select("post_id, profile_id").in("post_id", postIds);
  const counts = new Map<string, number>();
  const liked = new Set<string>();
  for (const row of data ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
    if (viewerId && row.profile_id === viewerId) liked.add(row.post_id);
  }
  return { counts, liked };
}

export async function seedDataEnabled(): Promise<boolean> {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase.from("platform_settings").select("seed_data_enabled").eq("id", 1).maybeSingle();
  return Boolean(data?.seed_data_enabled);
}

export async function listCommentsForPosts(postIds: string[]): Promise<ListResult<PostComment>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  if (postIds.length === 0) return listOk([]);
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .in("post_id", postIds)
    .order("created_at");
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      postId: row.post_id,
      authorId: row.author_profile_id,
      body: row.body,
      createdAt: row.created_at,
    })),
  );
}

export async function listPostsByAuthor(profileId?: string, organisationId?: string): Promise<ListResult<Post>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("posts").select("*, post_media(storage_path)").is("hidden_at", null).order("created_at", { ascending: false });
  if (profileId) q = q.eq("author_profile_id", profileId);
  if (organisationId) q = q.eq("author_organisation_id", organisationId);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapPost));
}

export async function listExperiences(profileId: string): Promise<ListResult<Experience>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("professional_experiences")
    .select("*")
    .eq("profile_id", profileId)
    .order("start_date", { ascending: false });
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapExperience));
}

export async function listProfileSkills(profileId: string): Promise<ListResult<ProfileSkill>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("profile_skills")
    .select("id, verification_level, rating, years_experience, category, skills(name)")
    .eq("profile_id", profileId);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapSkill));
}

export async function listPublicCertifications(profileId: string): Promise<ListResult<ProfileCertification>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("profile_certifications")
    .select("*")
    .eq("profile_id", profileId)
    .eq("public_visible", true);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapCert));
}

export async function listRecommendations(profileId: string): Promise<ListResult<RecommendationRow>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("recommendations")
    .select("id, from_profile_id, relationship, body, created_at")
    .eq("to_profile_id", profileId);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((r) => ({
      id: r.id,
      fromProfileId: r.from_profile_id,
      relationship: r.relationship,
      body: r.body,
      createdAt: r.created_at,
    })),
  );
}

export async function listOptedInProjects(profileId: string): Promise<ListResult<NetworkProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("project_contributors")
    .select("network_projects(*)")
    .eq("profile_id", profileId)
    .eq("opted_in", true);
  if (error) return listFail(error.message);
  const projects = (data ?? [])
    .map((row) => {
      const p = row.network_projects as unknown;
      return p && typeof p === "object" ? mapProject(p as Parameters<typeof mapProject>[0]) : null;
    })
    .filter((p): p is NetworkProject => p !== null);
  return listOk(projects);
}

export async function listOrgPeople(organisationId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("organisation_members")
    .select("profile_id, public_profiles(*)")
    .eq("organisation_id", organisationId)
    .eq("visibility", "public")
    .eq("invite_status", "active");
  if (error) return listFail(error.message);
  const people = (data ?? [])
    .map((row) => {
      const p = row.public_profiles as unknown;
      return p && typeof p === "object" ? mapPublicProfile(p as Parameters<typeof mapPublicProfile>[0]) : null;
    })
    .filter((p): p is PublicProfile => p !== null);
  return listOk(people);
}

export async function listOrgServices(organisationId: string): Promise<ListResult<OrgService>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("organisation_services").select("*").eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((s) => ({
      id: s.id,
      organisationId: s.organisation_id,
      name: s.name,
      description: s.description,
      locations: s.locations ?? [],
      pricingModel: s.pricing_model,
    })),
  );
}

export async function listOrgCredentials(organisationId: string): Promise<ListResult<OrgCredential>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("organisation_credentials")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("public_visible", true);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      verificationState: c.verification_state,
      expiryLabel: c.expiry_label,
    })),
  );
}

export async function listOrgReviews(organisationId: string): Promise<ListResult<ReviewRow>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("reviews").select("*").eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((r) => ({
      id: r.id,
      relationship: r.relationship,
      rating: Number(r.rating),
      body: r.body,
      reviewerName: r.reviewer_name,
      reviewerRole: r.reviewer_role,
      createdAt: r.created_at,
    })),
  );
}

export async function listOrgProjects(organisationId: string): Promise<ListResult<NetworkProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("project_organisations")
    .select("network_projects(*)")
    .eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  const projects = (data ?? [])
    .map((row) => {
      const p = row.network_projects as unknown;
      return p && typeof p === "object" ? mapProject(p as Parameters<typeof mapProject>[0]) : null;
    })
    .filter((p): p is NetworkProject => p !== null);
  return listOk(projects);
}

export async function listOrgJobs(organisationId: string): Promise<ListResult<JobPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("job_posts").select("*").eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapJob));
}

export async function listOrgGigs(organisationId: string): Promise<ListResult<GigPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("gig_posts").select("*").eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapGig));
}

export async function listSkillsCatalog(): Promise<ListResult<SkillCatalogItem>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("skills").select("*").order("name");
  if (error) return listFail(error.message);
  return listOk((data ?? []).map((s) => ({ id: s.id, name: s.name, category: s.category })));
}

export async function listAllServices(): Promise<ListResult<OrgService>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("organisation_services").select("*").order("name");
  if (error) return listFail(error.message);
  const orgIds = [...new Set((data ?? []).map((row) => row.organisation_id).filter(Boolean))];
  const orgs = orgIds.length
    ? await supabase.from("organisations").select("id, slug, name, organisation_type").in("id", orgIds)
    : { data: [] };
  const byId = new Map((orgs.data ?? []).map((row) => [row.id, row]));
  return listOk(
    (data ?? []).map((s) => {
      const org = byId.get(s.organisation_id);
      return {
        id: s.id,
        organisationId: s.organisation_id,
        organisationSlug: org?.slug ?? null,
        organisationName: org?.name ?? null,
        passportKind: org ? inferPassportKind(org.organisation_type) : "other",
        name: s.name,
        description: s.description,
        locations: s.locations ?? [],
        pricingModel: s.pricing_model,
      };
    }),
  );
}

export async function searchNetwork(query: string) {
  const q = sanitizeFilter(query);
  const [people, peopleBySkill, companies, jobs, gigs, projects, posts, skills, services] = await Promise.all([
    listPublicProfiles(q ? { query: q } : {}),
    q ? listPublicProfiles({ skill: q }) : Promise.resolve(listOk<PublicProfile>([])),
    listOrganisations(q || undefined),
    listJobs(),
    listGigs(),
    listProjects(),
    listFeedPosts(),
    listSkillsCatalog(),
    listAllServices(),
  ]);
  const ql = q.toLowerCase();
  if (q) {
    const supabase = await createServerSupabase();
    if (supabase) await trackEvent(supabase, "search_performed", "search", q.slice(0, 80));
  }
  const peopleById = new Map<string, PublicProfile>();
  for (const person of [...people.data, ...peopleBySkill.data]) peopleById.set(person.id, person);
  const matchedJobs = q
    ? jobs.data.filter((j) => j.title.toLowerCase().includes(ql) || j.skills.some((s) => s.toLowerCase().includes(ql)))
    : jobs.data;
  const matchedGigs = q ? gigs.data.filter((g) => `${g.title} ${g.trade ?? ""}`.toLowerCase().includes(ql)) : gigs.data;
  return {
    people: rankPeople([...peopleById.values()], q),
    companies: rankOrganisations(companies.data, q),
    jobs: rankJobs(matchedJobs, q),
    gigs: rankGigs(matchedGigs, q),
    projects: q ? projects.data.filter((p) => `${p.name} ${p.summary ?? ""}`.toLowerCase().includes(ql)) : projects.data,
    posts: q ? posts.data.filter((p) => p.body.toLowerCase().includes(ql)) : posts.data.slice(0, 8),
    skills: q ? skills.data.filter((s) => s.name.toLowerCase().includes(ql)) : skills.data,
    services: q ? services.data.filter((s) => s.name.toLowerCase().includes(ql)) : services.data,
    meta: people.meta,
  };
}

export async function listConversations(profileId: string): Promise<ListResult<ConversationSummary>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, conversations(id, title, kind, created_at)")
    .eq("profile_id", profileId);
  if (error) return listFail(error.message);
  const items: ConversationSummary[] = [];
  const conversationIds = (memberships ?? [])
    .map((row) => (row.conversations as unknown as { id: string } | null)?.id)
    .filter((id): id is string => Boolean(id));
  const unreadByConversation = new Map<string, number>();
  if (conversationIds.length > 0) {
    const unread = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", profileId)
      .is("read_at", null);
    for (const row of unread.data ?? []) {
      unreadByConversation.set(row.conversation_id, (unreadByConversation.get(row.conversation_id) ?? 0) + 1);
    }
  }
  const peerIds = new Set<string>();
  const membersByConversation = new Map<string, string[]>();
  if (conversationIds.length > 0) {
    const members = await supabase
      .from("conversation_members")
      .select("conversation_id, profile_id")
      .in("conversation_id", conversationIds);
    for (const row of members.data ?? []) {
      const list = membersByConversation.get(row.conversation_id) ?? [];
      list.push(row.profile_id);
      membersByConversation.set(row.conversation_id, list);
      if (row.profile_id !== profileId) peerIds.add(row.profile_id);
    }
  }
  const peers =
    peerIds.size > 0
      ? await supabase.from("public_profiles").select("id, handle, full_name, avatar_path, occupation_mode").in("id", [...peerIds])
      : { data: [] as { id: string; handle: string; full_name: string; avatar_path: string | null; occupation_mode: string | null }[] };
  const peerById = new Map((peers.data ?? []).map((row) => [row.id, row]));
  for (const row of memberships ?? []) {
    const c = row.conversations as unknown as { id: string; title: string | null; kind: string; created_at: string } | null;
    if (!c) continue;
    const { data: last } = await supabase
      .from("messages")
      .select("body, created_at")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const otherId = (membersByConversation.get(c.id) ?? []).find((id) => id !== profileId);
    const peer = otherId ? peerById.get(otherId) : null;
    items.push({
      id: c.id,
      title: peer?.full_name ?? c.title,
      kind: c.kind,
      preview: last?.body ?? null,
      updatedAt: last?.created_at ?? c.created_at,
      unreadCount: unreadByConversation.get(c.id) ?? 0,
      peerAvatar: peer?.avatar_path ?? null,
      peerHref: peer ? personPublicHref(peer.handle, peer.occupation_mode) : null,
    });
  }
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return listOk(items);
}

export async function listMessages(conversationId: string): Promise<ListResult<MessageRow>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at");
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      body: m.body,
      readAt: m.read_at ?? null,
      createdAt: m.created_at,
    })),
  );
}

export async function listNotifications(profileId: string): Promise<ListResult<NotificationRow>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.read_at,
      createdAt: n.created_at,
    })),
  );
}

export async function listConnections(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`);
  if (error) return listFail(error.message);
  const ids = (data ?? [])
    .map((c) => (c.requester_id === profileId ? c.addressee_id : c.requester_id))
    .filter(Boolean);
  if (ids.length === 0) return listOk([]);
  const { data: people, error: pErr } = await supabase.from("public_profiles").select("*").in("id", ids);
  if (pErr) return listFail(pErr.message);
  return listOk((people ?? []).map(mapPublicProfile));
}

export async function getConnectionState(viewerId: string, otherId: string): Promise<ConnectionState> {
  const states = await getConnectionStates(viewerId, [otherId]);
  return states.get(otherId) ?? "connect";
}

export async function getConnectionStates(
  viewerId: string | null | undefined,
  otherIds: string[],
): Promise<Map<string, ConnectionState>> {
  const states = new Map<string, ConnectionState>();
  for (const id of otherIds) states.set(id, "connect");
  if (!viewerId || otherIds.length === 0) return states;
  const supabase = await createServerSupabase();
  if (!supabase) return states;
  const { data } = await supabase
    .from("connections")
    .select("status, requester_id, addressee_id")
    .or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`);
  const wanted = new Set(otherIds);
  for (const row of data ?? []) {
    const other = row.requester_id === viewerId ? row.addressee_id : row.requester_id;
    if (!wanted.has(other)) continue;
    if (row.status === "accepted") states.set(other, "connected");
    else if (row.status === "pending") states.set(other, row.requester_id === viewerId ? "pending" : "incoming");
  }
  return states;
}

export async function isFollowing(viewerId: string, target: { personId?: string; organisationId?: string }) {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  let q = supabase.from("follows").select("id").eq("follower_id", viewerId);
  if (target.personId) q = q.eq("person_id", target.personId);
  if (target.organisationId) q = q.eq("organisation_id", target.organisationId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}
