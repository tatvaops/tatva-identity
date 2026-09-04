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
} from "@/lib/data/mappers";
import {
  itemFail,
  itemOk,
  listFail,
  listOk,
  pageRange,
  unconfiguredItem,
  unconfiguredList,
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
};

export async function listPublicProfiles(
  filters: PeopleFilters = {},
  options: ListOptions = {},
): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("public_profiles").select("*").order("full_name");
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.availability) q = q.eq("availability_status", filters.availability);
  if (filters.organisationId) q = q.eq("current_organisation_id", filters.organisationId);
  if (filters.query) {
    q = q.or(
      `full_name.ilike.%${filters.query}%,headline.ilike.%${filters.query}%,about.ilike.%${filters.query}%`,
    );
  }
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapPublicProfile));
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

export async function listOrganisations(
  query?: string,
  type?: string,
  options: ListOptions = {},
): Promise<ListResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("organisations").select("*").order("name");
  if (query) q = q.or(`name.ilike.%${query}%,tagline.ilike.%${query}%,industry.ilike.%${query}%`);
  if (type) q = q.eq("organisation_type", type);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapOrganisation));
}

export async function getOrganisationBySlug(slug: string): Promise<ItemResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("organisations").select("*").eq("slug", slug).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapOrganisation(data) : null);
}

export async function getOrganisationById(id: string): Promise<ItemResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("organisations").select("*").eq("id", id).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapOrganisation(data) : null);
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
  let q = supabase.from("job_posts").select("*").order("created_at", { ascending: false });
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.employmentType) q = q.eq("employment_type", filters.employmentType);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapJob));
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
  let q = supabase.from("gig_posts").select("*").order("created_at", { ascending: false });
  if (filters.trade) q = q.ilike("trade", `%${filters.trade}%`);
  const range = pageRange(options);
  if (range) q = q.range(range.from, range.to);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  const rows = filters.city
    ? (data ?? []).filter((row) => String(row.site_name ?? "").toLowerCase().includes(filters.city!.toLowerCase()))
    : (data ?? []);
  return listOk(sortGigsNearby(rows.map(mapGig)));
}

export async function getGig(id: string): Promise<ItemResult<GigPost>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("gig_posts").select("*").eq("id", id).maybeSingle();
  if (error) return itemFail(error.message);
  return itemOk(data ? mapGig(data) : null);
}

export async function listFeedPosts(): Promise<ListResult<Post>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapPost));
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
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
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
    .select("id, verification_level, rating, skills(name)")
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
    .eq("visibility", "public");
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

export async function searchNetwork(query: string) {
  const q = query.trim();
  const [people, companies, jobs, gigs, projects, posts, skills, services] = await Promise.all([
    listPublicProfiles(q ? { query: q } : {}),
    listOrganisations(q || undefined),
    listJobs(),
    listGigs(),
    listProjects(),
    listFeedPosts(),
    listSkillsCatalog(),
    listAllServices(),
  ]);
  const ql = q.toLowerCase();
  const matchedJobs = q
    ? jobs.data.filter((j) => j.title.toLowerCase().includes(ql) || j.skills.some((s) => s.toLowerCase().includes(ql)))
    : jobs.data;
  const matchedGigs = q ? gigs.data.filter((g) => `${g.title} ${g.trade ?? ""}`.toLowerCase().includes(ql)) : gigs.data;
  return {
    people: rankPeople(people.data, q),
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
    items.push({
      id: c.id,
      title: c.title,
      kind: c.kind,
      preview: last?.body ?? null,
      updatedAt: last?.created_at ?? c.created_at,
    });
  }
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

export async function getConnectionState(
  viewerId: string,
  otherId: string,
): Promise<"connect" | "pending" | "connected"> {
  const supabase = await createServerSupabase();
  if (!supabase) return "connect";
  const { data } = await supabase
    .from("connections")
    .select("status, requester_id")
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${viewerId})`,
    )
    .maybeSingle();
  if (!data) return "connect";
  if (data.status === "accepted") return "connected";
  return "pending";
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
