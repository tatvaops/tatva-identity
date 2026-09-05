import { requirePlatformAdminResult } from "@/lib/admin/access";
import { adminSearchTerm } from "@/lib/admin/search";

export type AdminStats = {
  people: number;
  organisations: number;
  openJobs: number;
  openGigs: number;
  posts: number;
  pendingVerifications: number;
  openReports: number;
  operators: number;
  seedEnabled: boolean;
  hiddenPeople: number;
  hiddenOrganisations: number;
};

async function adminClient() {
  const gate = await requirePlatformAdminResult();
  if (!gate.ok) return null;
  return gate.auth.admin;
}

export async function loadAdminStats(): Promise<AdminStats | null> {
  const admin = await adminClient();
  if (!admin) return null;
  const [
    people,
    organisations,
    jobs,
    gigs,
    posts,
    verifications,
    reports,
    operators,
    settings,
    hiddenPeople,
    hiddenOrgs,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("organisations").select("id", { count: "exact", head: true }),
    admin.from("job_posts").select("id", { count: "exact", head: true }).is("closed_at", null),
    admin.from("gig_posts").select("id", { count: "exact", head: true }).is("closed_at", null),
    admin.from("posts").select("id", { count: "exact", head: true }).is("hidden_at", null),
    admin.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    admin.from("platform_admins").select("profile_id", { count: "exact", head: true }),
    admin.from("platform_settings").select("seed_data_enabled").eq("id", 1).maybeSingle(),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("admin_hidden", true),
    admin.from("organisations").select("id", { count: "exact", head: true }).eq("admin_hidden", true),
  ]);
  return {
    people: people.count ?? 0,
    organisations: organisations.count ?? 0,
    openJobs: jobs.count ?? 0,
    openGigs: gigs.count ?? 0,
    posts: posts.count ?? 0,
    pendingVerifications: verifications.count ?? 0,
    openReports: reports.count ?? 0,
    operators: operators.count ?? 0,
    seedEnabled: Boolean(settings.data?.seed_data_enabled),
    hiddenPeople: hiddenPeople.count ?? 0,
    hiddenOrganisations: hiddenOrgs.count ?? 0,
  };
}

export async function listAdminPeople(query: string, page = 1) {
  const admin = await adminClient();
  if (!admin) return { rows: [], total: 0 };
  const pageSize = 24;
  const from = (page - 1) * pageSize;
  let q = admin
    .from("profiles")
    .select("id, handle, full_name, headline, city, identity_verified, employment_verified, trade_verified, admin_hidden, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  const term = adminSearchTerm(query);
  if (term) q = q.or(`full_name.ilike.%${term}%,handle.ilike.%${term}%,city.ilike.%${term}%`);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getAdminPerson(id: string) {
  const admin = await adminClient();
  if (!admin) return null;
  const profile = await admin.from("profiles").select("id, handle, full_name, headline, about, city, state, occupation_mode, professional_title, identity_verified, employment_verified, trade_verified, admin_hidden, created_at, website").eq("id", id).maybeSingle();
  if (!profile.data) return null;
  const [requests, certs] = await Promise.all([
    admin.from("verification_requests").select("id, kind, status, created_at, reviewer_note").eq("profile_id", id).order("created_at", { ascending: false }),
    admin.from("profile_certifications").select("id, name, issuer, category, verification_state, public_visible").eq("profile_id", id).order("created_at", { ascending: false }),
  ]);
  return { profile: profile.data, requests: requests.data ?? [], certifications: certs.data ?? [] };
}

export async function listAdminOrganisations(query: string, page = 1) {
  const admin = await adminClient();
  if (!admin) return { rows: [], total: 0 };
  const pageSize = 24;
  const from = (page - 1) * pageSize;
  let q = admin
    .from("organisations")
    .select("id, slug, name, organisation_type, city, industry, admin_hidden, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  const term = adminSearchTerm(query);
  if (term) q = q.or(`name.ilike.%${term}%,slug.ilike.%${term}%,city.ilike.%${term}%`);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getAdminOrganisation(id: string) {
  const admin = await adminClient();
  if (!admin) return null;
  const org = await admin.from("organisations").select("id, slug, name, tagline, about, organisation_type, passport_kind, city, industry, admin_hidden, public_phone, public_email, website, gst_verified, kyc_verified, created_at").eq("id", id).maybeSingle();
  if (!org.data) return null;
  const [creds, projects, ai] = await Promise.all([
    admin.from("organisation_credentials").select("id, name, category, verification_state, expiry_label").eq("organisation_id", id),
    admin.from("network_projects").select("id, slug, name, verified, status, city").or(`client_organisation_id.eq.${id},main_contractor_id.eq.${id}`),
    admin.from("organisation_ai_review_settings").select("ai_review_source, ai_review_enabled, minimum_source_count").eq("organisation_id", id).maybeSingle(),
  ]);
  return { organisation: org.data, credentials: creds.data ?? [], projects: projects.data ?? [], ai: ai.data };
}

export async function listAdminForumLinks() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("forum_entity_links")
    .select("id, entity_type, entity_id, brand_id, thread_slug, canonical_url, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(80);
  return data ?? [];
}

export async function listAdminCredentials() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("api_credentials")
    .select("id, name, scopes, expires_at, revoked_at, last_used_at, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAdminVerifications(status = "pending") {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("verification_requests")
    .select("id, kind, status, created_at, profile_id, organisation_id, reviewer_note")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = data ?? [];
  const profileIds = [...new Set(rows.map((row) => row.profile_id).filter(Boolean))];
  const people =
    profileIds.length > 0
      ? await admin.from("profiles").select("id, handle, full_name").in("id", profileIds)
      : { data: [] };
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, person: row.profile_id ? byId.get(row.profile_id) ?? null : null }));
}

export async function listAdminJobs() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("job_posts")
    .select("id, title, city, employment_type, closed_at, created_at, organisation_id")
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((row) => row.organisation_id).filter(Boolean))] as string[];
  const orgs = orgIds.length ? await admin.from("organisations").select("id, name, slug").in("id", orgIds) : { data: [] };
  const byId = new Map((orgs.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, organisation: row.organisation_id ? byId.get(row.organisation_id) ?? null : null }));
}

export async function listAdminGigs() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("gig_posts")
    .select("id, title, trade, site_name, closed_at, created_at, seats, organisation_id")
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((row) => row.organisation_id).filter(Boolean))] as string[];
  const orgs = orgIds.length ? await admin.from("organisations").select("id, name, slug").in("id", orgIds) : { data: [] };
  const byId = new Map((orgs.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, organisation: row.organisation_id ? byId.get(row.organisation_id) ?? null : null }));
}

export async function listAdminPosts() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("posts")
    .select("id, body, post_type, created_at, hidden_at, author_profile_id")
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => row.author_profile_id).filter(Boolean))] as string[];
  const people = ids.length ? await admin.from("profiles").select("id, handle, full_name").in("id", ids) : { data: [] };
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, author: row.author_profile_id ? byId.get(row.author_profile_id) ?? null : null }));
}

export async function listAdminReports() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("content_reports")
    .select("id, entity_kind, entity_id, reason, status, created_at, reporter_id")
    .order("created_at", { ascending: false })
    .limit(80);
  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => row.reporter_id).filter(Boolean))] as string[];
  const people = ids.length ? await admin.from("profiles").select("id, handle, full_name").in("id", ids) : { data: [] };
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, reporter: row.reporter_id ? byId.get(row.reporter_id) ?? null : null }));
}

export async function listAdminProjects() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin.from("network_projects").select("id, slug, name, city, status, verified, created_at").order("created_at", { ascending: false }).limit(80);
  return data ?? [];
}

export async function listAdminOperators() {
  const admin = await adminClient();
  if (!admin) return [];
  const { data } = await admin.from("platform_admins").select("profile_id, created_at, granted_by").order("created_at", { ascending: false });
  const ids = [...new Set((data ?? []).flatMap((row) => [row.profile_id, row.granted_by].filter(Boolean)))] as string[];
  const people = ids.length ? await admin.from("profiles").select("id, handle, full_name").in("id", ids) : { data: [] };
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return (data ?? []).map((row) => ({
    ...row,
    person: byId.get(row.profile_id) ?? null,
    grantor: row.granted_by ? byId.get(row.granted_by) ?? null : null,
  }));
}

export async function listAdminAudit(page = 1) {
  const admin = await adminClient();
  if (!admin) return { rows: [], total: 0 };
  const pageSize = 40;
  const from = (page - 1) * pageSize;
  const { data, count } = await admin
    .from("audit_logs")
    .select("id, actor_id, action, entity_kind, entity_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  const rows = data ?? [];
  const ids = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))] as string[];
  const people = ids.length ? await admin.from("profiles").select("id, handle, full_name").in("id", ids) : { data: [] };
  const byId = new Map((people.data ?? []).map((row) => [row.id, row]));
  return {
    rows: rows.map((row) => ({ ...row, actor: row.actor_id ? byId.get(row.actor_id) ?? null : null })),
    total: count ?? 0,
  };
}

export async function listAdminEvents() {
  const admin = await adminClient();
  if (!admin) return [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin.from("product_events").select("name, created_at").gte("created_at", since).limit(2000);
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.name, (counts.get(row.name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function countAdminViews() {
  const admin = await adminClient();
  if (!admin) return { profileViews: 0, orgViews: 0, searchAppearances: 0 };
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [profileViews, orgViews, search] = await Promise.all([
    admin.from("profile_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("organisation_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("search_appearances").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);
  return {
    profileViews: profileViews.count ?? 0,
    orgViews: orgViews.count ?? 0,
    searchAppearances: search.count ?? 0,
  };
}
