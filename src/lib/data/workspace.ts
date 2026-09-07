import { createServerSupabase } from "@/lib/supabase/server";
import { mapGig, mapJob, mapOrganisation, mapPublicProfile, ORGANISATION_SAFE_COLUMNS } from "@/lib/data/mappers";
import { itemFail, itemOk, listFail, listOk, unconfiguredItem, unconfiguredList, type ItemResult, type ListResult } from "@/lib/data/query";
import type {
  GigPost,
  JobPost,
  NetworkProject,
  OpportunityApplication,
  Organisation,
  PendingConnection,
  ProfileEducation,
  ProfileService,
  ProjectMedia,
  ProjectMilestone,
  PublicProfile,
  SavedItem,
  EvidenceItem,
} from "@/lib/types/identity";
import { listConnections, listOptedInProjects, listOrgPeople, listPublicProfiles } from "@/lib/data/network";

async function profilesByIds(ids: string[]): Promise<ListResult<PublicProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return listOk([]);
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("public_profiles").select("*").in("id", unique);
  if (error) return listFail(error.message);
  return listOk((data ?? []).map(mapPublicProfile));
}

export async function listPendingConnections(profileId: string): Promise<ListResult<PendingConnection>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id")
    .eq("addressee_id", profileId)
    .eq("status", "pending");
  if (error) return listFail(error.message);
  const people = await profilesByIds((data ?? []).map((row) => row.requester_id));
  const byId = new Map(people.data.map((profile) => [profile.id, profile]));
  return listOk(
    (data ?? [])
      .map((row) => {
        const profile = byId.get(row.requester_id);
        return profile ? { id: row.id, profile } : null;
      })
      .filter((row): row is PendingConnection => row !== null),
  );
}

export async function listFollowers(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("follows").select("follower_id").eq("person_id", profileId);
  if (error) return listFail(error.message);
  return profilesByIds((data ?? []).map((row) => row.follower_id));
}

export async function listFollowing(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("follows")
    .select("person_id")
    .eq("follower_id", profileId)
    .not("person_id", "is", null);
  if (error) return listFail(error.message);
  return profilesByIds((data ?? []).map((row) => row.person_id).filter(Boolean));
}

export async function listWorkedWith(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data: mine, error } = await supabase
    .from("project_contributors")
    .select("project_id")
    .eq("profile_id", profileId)
    .eq("opted_in", true);
  if (error) return listFail(error.message);
  const projectIds = [...new Set((mine ?? []).map((row) => row.project_id))];
  if (projectIds.length === 0) return listOk([]);
  const { data: others, error: otherError } = await supabase
    .from("project_contributors")
    .select("profile_id")
    .in("project_id", projectIds)
    .eq("opted_in", true)
    .neq("profile_id", profileId);
  if (otherError) return listFail(otherError.message);
  return profilesByIds((others ?? []).map((row) => row.profile_id));
}

export async function listOwnedOrganisations(profileId: string): Promise<ListResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).eq("created_by", profileId).order("name");
  if (error) return listFail(error.message);
  return listOk((data ?? []).map((row) => mapOrganisation(row)));
}

export async function listMemberOrganisations(profileId: string): Promise<ListResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("organisation_members")
    .select(`organisations(${ORGANISATION_SAFE_COLUMNS})`)
    .eq("profile_id", profileId);
  if (error) return listFail(error.message);
  const orgs = (data ?? [])
    .map((row) => {
      const org = row.organisations as unknown;
      return org && typeof org === "object" ? mapOrganisation(org as Parameters<typeof mapOrganisation>[0]) : null;
    })
    .filter((org): org is Organisation => org !== null);
  return listOk(orgs);
}

export async function listProjectPeople(projectId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("project_contributors")
    .select("public_profiles(*)")
    .eq("project_id", projectId)
    .eq("opted_in", true);
  if (error) return listFail(error.message);
  const people = (data ?? [])
    .map((row) => {
      const profile = row.public_profiles as unknown;
      return profile && typeof profile === "object"
        ? mapPublicProfile(profile as Parameters<typeof mapPublicProfile>[0])
        : null;
    })
    .filter((profile): profile is PublicProfile => profile !== null);
  return listOk(people);
}

export async function listProjectCompanies(project: NetworkProject): Promise<ListResult<Organisation>> {
  const ids = [project.clientOrganisationId, project.mainContractorId].filter(Boolean) as string[];
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data: linked, error } = await supabase.from("project_organisations").select(`organisations(${ORGANISATION_SAFE_COLUMNS})`).eq("project_id", project.id);
  if (error) return listFail(error.message);
  const fromLink = (linked ?? [])
    .map((row) => {
      const org = row.organisations as unknown;
      return org && typeof org === "object" ? mapOrganisation(org as Parameters<typeof mapOrganisation>[0]) : null;
    })
    .filter((org): org is Organisation => org !== null);
  if (ids.length === 0) return listOk(fromLink);
  const { data, error: idError } = await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).in("id", ids);
  if (idError) return listFail(idError.message);
  const byId = new Map(fromLink.map((org) => [org.id, org]));
  for (const row of data ?? []) {
    const mapped = mapOrganisation(row);
    byId.set(mapped.id, mapped);
  }
  return listOk([...byId.values()]);
}

export async function listJobApplications(jobId: string): Promise<ListResult<OpportunityApplication>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  const people = await profilesByIds((data ?? []).map((row) => row.profile_id));
  const byId = new Map(people.data.map((profile) => [profile.id, profile]));
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      entityId: row.job_id,
      profileId: row.profile_id,
      status: row.status,
      createdAt: row.created_at,
      profile: byId.get(row.profile_id) ?? null,
    })),
  );
}

export async function listGigApplications(gigId: string): Promise<ListResult<OpportunityApplication>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("gig_applications")
    .select("*")
    .eq("gig_id", gigId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  const people = await profilesByIds((data ?? []).map((row) => row.profile_id));
  const byId = new Map(people.data.map((profile) => [profile.id, profile]));
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      entityId: row.gig_id,
      profileId: row.profile_id,
      status: row.status,
      createdAt: row.created_at,
      profile: byId.get(row.profile_id) ?? null,
    })),
  );
}

export async function getMyJobApplication(profileId: string, jobId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("profile_id", profileId)
    .eq("job_id", jobId)
    .maybeSingle();
  return data;
}

export async function getMyGigApplication(profileId: string, gigId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("gig_applications")
    .select("id, status")
    .eq("profile_id", profileId)
    .eq("gig_id", gigId)
    .maybeSingle();
  return data;
}

export async function listMyJobApplications(profileId: string): Promise<ListResult<OpportunityApplication>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      entityId: row.job_id,
      profileId: row.profile_id,
      status: row.status,
      createdAt: row.created_at,
    })),
  );
}

export async function listMyGigApplications(profileId: string): Promise<ListResult<OpportunityApplication>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("gig_applications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      entityId: row.gig_id,
      profileId: row.profile_id,
      status: row.status,
      createdAt: row.created_at,
    })),
  );
}

export async function listOutgoingPendingConnections(profileId: string): Promise<ListResult<PendingConnection>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("connections")
    .select("id, addressee_id")
    .eq("requester_id", profileId)
    .eq("status", "pending");
  if (error) return listFail(error.message);
  const people = await profilesByIds((data ?? []).map((row) => row.addressee_id));
  const byId = new Map(people.data.map((profile) => [profile.id, profile]));
  return listOk(
    (data ?? [])
      .map((row) => {
        const profile = byId.get(row.addressee_id);
        return profile ? { id: row.id, profile } : null;
      })
      .filter((row): row is PendingConnection => row !== null),
  );
}

export async function listFollowingOrganisations(profileId: string): Promise<ListResult<Organisation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("follows")
    .select(`organisations(${ORGANISATION_SAFE_COLUMNS})`)
    .eq("follower_id", profileId)
    .not("organisation_id", "is", null);
  if (error) return listFail(error.message);
  const orgs = (data ?? [])
    .map((row) => {
      const org = row.organisations as unknown;
      return org && typeof org === "object" ? mapOrganisation(org as Parameters<typeof mapOrganisation>[0]) : null;
    })
    .filter((org): org is Organisation => org !== null);
  return listOk(orgs);
}

export async function listOrgFollowers(organisationId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("follows").select("follower_id").eq("organisation_id", organisationId);
  if (error) return listFail(error.message);
  return profilesByIds((data ?? []).map((row) => row.follower_id));
}

export async function listProfileServices(profileId: string): Promise<ListResult<ProfileService>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("profile_services")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      description: row.description,
      locations: row.locations ?? [],
      availabilityLabel: row.availability_label,
      category: row.category ?? null,
      pricingModel: row.pricing_model ?? null,
    })),
  );
}

export async function listProjectMilestones(projectId: string): Promise<ListResult<ProjectMilestone>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("occurred_on", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      body: row.body,
      occurredOn: row.occurred_on,
    })),
  );
}

export async function listProjectMedia(projectId: string): Promise<ListResult<ProjectMedia>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("project_media").select("*").eq("project_id", projectId);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      storagePath: row.storage_path,
      caption: row.caption,
      kind: row.kind as ProjectMedia["kind"],
    })),
  );
}

export async function countUniqueProfileViews(profileId: string): Promise<ItemResult<number>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { data, error } = await supabase.from("profile_views").select("viewer_profile_id").eq("viewed_profile_id", profileId);
  if (error) return itemFail(error.message);
  const unique = new Set((data ?? []).map((row) => row.viewer_profile_id).filter(Boolean));
  return itemOk(unique.size);
}

export async function countOrganisationViews(organisationId: string): Promise<ItemResult<number>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { count, error } = await supabase
    .from("organisation_views")
    .select("id", { count: "exact", head: true })
    .eq("organisation_id", organisationId);
  if (error) return itemFail(error.message);
  return itemOk(count ?? 0);
}

export async function listSearchAppearances(profileId: string): Promise<ListResult<{ id: string; query: string | null; createdAt: string }>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("search_appearances")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      query: row.query,
      createdAt: row.created_at,
    })),
  );
}

export async function listProfileDocuments(profileId: string): Promise<ListResult<{ id: string; label: string; createdAt: string }>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("profile_documents")
    .select("id, label, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      createdAt: row.created_at,
    })),
  );
}

export async function countProfileViews(profileId: string): Promise<ItemResult<number>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const { count, error } = await supabase
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .eq("viewed_profile_id", profileId);
  if (error) return itemFail(error.message);
  return itemOk(count ?? 0);
}

export async function recordProfileView(viewedProfileId: string, viewerProfileId: string | null) {
  if (viewerProfileId && viewerProfileId === viewedProfileId) return;
  const supabase = await createServerSupabase();
  if (!supabase) return;
  await supabase.from("profile_views").insert({
    viewed_profile_id: viewedProfileId,
    viewer_profile_id: viewerProfileId,
  });
}

export async function isSaved(profileId: string, entityKind: string, entityId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("saved_items")
    .select("id")
    .eq("profile_id", profileId)
    .eq("entity_kind", entityKind)
    .eq("entity_id", entityId)
    .maybeSingle();
  return Boolean(data);
}

export async function listSavedItems(profileId: string, entityKind?: string): Promise<ListResult<SavedItem>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  let q = supabase.from("saved_items").select("*").eq("profile_id", profileId).order("created_at", { ascending: false });
  if (entityKind) q = q.eq("entity_kind", entityKind);
  const { data, error } = await q;
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      entityKind: row.entity_kind,
      entityId: row.entity_id,
      createdAt: row.created_at,
    })),
  );
}

export async function hydrateSavedJobs(items: SavedItem[]): Promise<JobPost[]> {
  const ids = items.filter((item) => item.entityKind === "job").map((item) => item.entityId);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("job_posts").select("*").in("id", ids);
  return (data ?? []).map(mapJob);
}

export async function hydrateSavedGigs(items: SavedItem[]): Promise<GigPost[]> {
  const ids = items.filter((item) => item.entityKind === "gig").map((item) => item.entityId);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("gig_posts").select("*").in("id", ids);
  return (data ?? []).map(mapGig);
}

export async function hydrateSavedPeople(items: SavedItem[]): Promise<PublicProfile[]> {
  const ids = items.filter((item) => item.entityKind === "profile").map((item) => item.entityId);
  if (ids.length === 0) return [];
  const people = await profilesByIds(ids);
  return people.data;
}

export async function hydrateSavedOrgs(items: SavedItem[]): Promise<Organisation[]> {
  const ids = items.filter((item) => item.entityKind === "organisation").map((item) => item.entityId);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("organisations").select(ORGANISATION_SAFE_COLUMNS).in("id", ids);
  return (data ?? []).map((row) => mapOrganisation(row));
}

export async function getWorkGraph(profileId: string) {
  const [workedWith, connections, owned, members, projects] = await Promise.all([
    listWorkedWith(profileId),
    listConnections(profileId),
    listOwnedOrganisations(profileId),
    listMemberOrganisations(profileId),
    listOptedInProjects(profileId),
  ]);
  const orgs = new Map<string, Organisation>();
  for (const org of [...owned.data, ...members.data]) orgs.set(org.id, org);
  const colleagues: PublicProfile[] = [];
  for (const org of orgs.values()) {
    const people = await listOrgPeople(org.id);
    for (const person of people.data) {
      if (person.id !== profileId && !colleagues.some((row) => row.id === person.id)) colleagues.push(person);
    }
  }
  return {
    workedWith: workedWith.data,
    connections: connections.data,
    organisations: [...orgs.values()],
    colleagues,
    projects: projects.data,
  };
}

export async function discoverPeople(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const [connections, directory, viewer, skills] = await Promise.all([
    listConnections(profileId),
    listPublicProfiles({}, { pageSize: 40 }),
    supabase.from("public_profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", profileId),
  ]);
  const viewerProfile = viewer.data ? mapPublicProfile(viewer.data) : null;
  const hidden = new Set([profileId, ...connections.data.map((profile) => profile.id)]);
  const mySkills = new Set((skills.data ?? []).map((row) => row.skill_id));
  const candidates = directory.data.filter((profile) => !hidden.has(profile.id));
  if (!viewerProfile || candidates.length === 0) return listOk(candidates.slice(0, 8));
  const otherSkills = await supabase
    .from("profile_skills")
    .select("profile_id, skill_id")
    .in(
      "profile_id",
      candidates.map((row) => row.id),
    );
  const skillCounts = new Map<string, number>();
  for (const row of otherSkills.data ?? []) {
    if (mySkills.has(row.skill_id)) skillCounts.set(row.profile_id, (skillCounts.get(row.profile_id) ?? 0) + 1);
  }
  const { relevanceScore, rankSuggestions } = await import("@/lib/domain/recommendations");
  const scored = candidates.map((person) => ({
    person,
    score: relevanceScore(viewerProfile, person, {
      sharedSkillCount: skillCounts.get(person.id) ?? 0,
      mutualConnectionCount: 0,
      sharedOrganisation: Boolean(
        viewerProfile.currentOrganisationId && viewerProfile.currentOrganisationId === person.currentOrganisationId,
      ),
    }),
  }));
  return listOk(rankSuggestions(scored, 8).map((row) => row.person));
}

export async function listEducation(profileId: string): Promise<ListResult<ProfileEducation>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("profile_education")
    .select("*")
    .eq("profile_id", profileId)
    .order("start_date", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      institution: row.institution,
      qualification: row.qualification,
      course: row.course,
      fieldOfStudy: row.field_of_study,
      startDate: row.start_date,
      endDate: row.end_date,
      credentialIdPublic: row.credential_id_public,
    })),
  );
}

export async function listEvidence(profileId: string): Promise<ListResult<EvidenceItem>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("evidence_items")
    .select("id, profile_id, claim_kind, claim_id, media_path, note, verification_state, is_public, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) return listFail(error.message);
  return listOk(
    (data ?? []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      claimKind: row.claim_kind,
      claimId: row.claim_id,
      mediaPath: row.media_path,
      note: row.note,
      verificationState: row.verification_state,
      isPublic: row.is_public ?? true,
      createdAt: row.created_at,
    })),
  );
}

export async function getOnboardingStep(profileId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { data } = await supabase.from("profiles").select("onboarding_step").eq("id", profileId).maybeSingle();
  return typeof data?.onboarding_step === "number" ? data.onboarding_step : 0;
}

export async function countReceivedApplicationsForOrganisations(organisationIds: string[]): Promise<number> {
  const unique = [...new Set(organisationIds.filter(Boolean))];
  if (unique.length === 0) return 0;
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const [{ data: jobs }, { data: gigs }] = await Promise.all([
    supabase.from("job_posts").select("id").in("organisation_id", unique),
    supabase.from("gig_posts").select("id").in("organisation_id", unique),
  ]);
  const jobIds = (jobs ?? []).map((row) => row.id as string);
  const gigIds = (gigs ?? []).map((row) => row.id as string);
  const [jobCount, gigCount] = await Promise.all([
    jobIds.length
      ? supabase.from("job_applications").select("id", { count: "exact", head: true }).in("job_id", jobIds)
      : Promise.resolve({ count: 0 }),
    gigIds.length
      ? supabase.from("gig_applications").select("id", { count: "exact", head: true }).in("gig_id", gigIds)
      : Promise.resolve({ count: 0 }),
  ]);
  return (jobCount.count ?? 0) + (gigCount.count ?? 0);
}

export async function countOrganisationViewsForIds(organisationIds: string[]): Promise<number> {
  const unique = [...new Set(organisationIds.filter(Boolean))];
  if (unique.length === 0) return 0;
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("organisation_views")
    .select("id", { count: "exact", head: true })
    .in("organisation_id", unique);
  return count ?? 0;
}

export async function countProjectViewsForProfile(profileId: string): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("project_contributors")
    .select("project_id")
    .eq("profile_id", profileId)
    .eq("opted_in", true);
  const ids = [...new Set((data ?? []).map((row) => row.project_id as string))];
  if (ids.length === 0) return 0;
  const { count } = await supabase.from("project_views").select("id", { count: "exact", head: true }).in("project_id", ids);
  return count ?? 0;
}

export async function listBlockedPeople(profileId: string): Promise<ListResult<PublicProfile>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase.from("profile_blocks").select("blocked_id").eq("blocker_id", profileId);
  if (error) return listFail(error.message);
  return profilesByIds((data ?? []).map((row) => row.blocked_id));
}

export async function hydrateSavedProjects(items: SavedItem[]): Promise<NetworkProject[]> {
  const ids = items.filter((item) => item.entityKind === "project").map((item) => item.entityId);
  if (ids.length === 0) return [];
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("network_projects").select("*").in("id", ids);
  const { mapProject } = await import("@/lib/data/mappers");
  return (data ?? []).map(mapProject);
}

export async function loadNotificationPrefs(profileId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      notifyConnections: true,
      notifyMessages: true,
      notifyApplications: true,
      notifySocial: true,
      notifyOrganisation: true,
    };
  }
  const { data } = await supabase
    .from("profiles")
    .select("notify_connections, notify_messages, notify_applications, notify_social, notify_organisation")
    .eq("id", profileId)
    .maybeSingle();
  return {
    notifyConnections: data?.notify_connections ?? true,
    notifyMessages: data?.notify_messages ?? true,
    notifyApplications: data?.notify_applications ?? true,
    notifySocial: data?.notify_social ?? true,
    notifyOrganisation: data?.notify_organisation ?? true,
  };
}

export async function listMyOrganisationInvites(
  profileId: string,
): Promise<ListResult<{ id: string; roleTitle: string | null; organisation: Organisation }>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("organisation_members")
    .select(`id, role_title, organisations(${ORGANISATION_SAFE_COLUMNS})`)
    .eq("profile_id", profileId)
    .eq("invite_status", "invited");
  if (error) return listFail(error.message);
  const rows: { id: string; roleTitle: string | null; organisation: Organisation }[] = [];
  for (const row of data ?? []) {
    const org = row.organisations as unknown;
    if (!org || typeof org !== "object") continue;
    rows.push({
      id: String(row.id),
      roleTitle: (row.role_title as string | null) ?? null,
      organisation: mapOrganisation(org as Parameters<typeof mapOrganisation>[0]),
    });
  }
  return listOk(rows);
}

export async function userCanManageOrganisation(userId: string | null, organisationId: string) {
  if (!userId) return false;
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase.rpc("is_org_staff", { org_id: organisationId });
  return Boolean(data);
}

export async function isPersonMuted(muterId: string, mutedId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("profile_mutes")
    .select("muted_id")
    .eq("muter_id", muterId)
    .eq("muted_id", mutedId)
    .maybeSingle();
  return Boolean(data);
}

export async function isPersonBlocked(blockerId: string, blockedId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase
    .from("profile_blocks")
    .select("blocked_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}
