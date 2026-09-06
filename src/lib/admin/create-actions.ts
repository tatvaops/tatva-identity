"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limitAction } from "@/lib/actions/notify";
import { fail, type ActionResult } from "@/lib/actions/shared";
import { requirePlatformAdminResult } from "@/lib/admin/access";
import { alreadyExists, isValidHandle, splitList, suggestedHandle } from "@/lib/admin/create-helpers";
import { e164India, normalizeIndianMobile, phoneIdentityKey, phoneLoginEmail } from "@/lib/auth/phone";
import { slugify } from "@/lib/domain/slug";
import { organisationTypes } from "@/lib/domain/workspace-schemas";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const OCCUPATION_MODES = new Set(["white_collar", "blue_collar", "freelancer", "contractor"]);
const PASSPORT_KINDS = new Set(["service_brand", "product_brand", "other"]);
const PROJECT_STATUSES = new Set(["completed", "in_progress", "handover"]);
const JOB_TYPES = new Set(["permanent", "contract", "part_time", "temporary", "internship"]);
const GIG_DURATIONS = new Set(["4_hours", "1_shift", "1_day", "3_days", "1_week", "project"]);
const VERIFY_KINDS = new Set(["identity", "employment", "trade"]);
const POST_TYPES = new Set(["update", "project_update", "hiring", "gig", "announcement"]);
const CERT_CATEGORIES = new Set(["certification", "licence", "training", "safety", "professional_qualification"]);

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  revalidatePath("/companies");
  revalidatePath("/service-brands");
  revalidatePath("/product-brands");
  revalidatePath("/feed");
  revalidatePath("/jobs");
  revalidatePath("/gigs");
  revalidatePath("/projects");
  revalidatePath("/forums");
}

function optionalMediaRef(value: string): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.startsWith("https://")) {
    try {
      return { ok: true, value: new URL(trimmed).toString() };
    } catch {
      return { ok: false, error: "Enter a valid https URL." };
    }
  }
  if (/^[a-zA-Z0-9/_.-]+$/.test(trimmed)) return { ok: true, value: trimmed };
  return { ok: false, error: "Use an https URL or a storage path." };
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

async function operatorAudit(
  admin: SupabaseClient,
  actorId: string,
  action: string,
  entityKind: string,
  entityId: string,
) {
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_kind: entityKind,
    entity_id: entityId,
  });
}

async function gated() {
  const limited = await limitAction("admin-write", 80, 60_000);
  if (limited) return { ok: false as const, result: limited };
  const gate = await requirePlatformAdminResult();
  if (!gate.ok) return gate;
  if (!gate.auth.ctx.userId) return { ok: false as const, result: fail("This console is only for platform operators.") };
  return { ok: true as const, auth: gate.auth, actorId: gate.auth.ctx.userId };
}

async function uniqueHandle(admin: SupabaseClient, desired: string, excludeId?: string) {
  let handle = desired;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const existing = await admin.from("profiles").select("id").eq("handle", handle).maybeSingle();
    if (!existing.data || existing.data.id === excludeId) return handle;
    handle = slugify(desired.replace(/-[a-f0-9]{8}$/i, ""), "person");
  }
  return slugify(desired, "person");
}

async function findOrCreateAuthUser(
  admin: SupabaseClient,
  digits: string,
  fullName: string,
): Promise<string | null> {
  const email = phoneLoginEmail(digits);
  const phone = e164India(digits);
  const meta = {
    full_name: fullName,
    phone,
    identity_key: phoneIdentityKey(digits),
    auth_provider: "whatsapp-otp",
  };
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    phone,
    phone_confirm: true,
    user_metadata: meta,
  });
  if (!created.error && created.data.user?.id) return created.data.user.id;
  if (created.error && !alreadyExists(created.error.message)) {
    const emailOnly = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: meta,
    });
    if (!emailOnly.error && emailOnly.data.user?.id) return emailOnly.data.user.id;
    if (emailOnly.error && !alreadyExists(emailOnly.error.message)) return null;
  }
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  return link.data.user?.id ?? null;
}

export async function adminUploadPublicFile(formData: FormData): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image first.");
  if (file.size > 5 * 1024 * 1024) return fail("Keep images under 5 MB.");
  if (!IMAGE_TYPES.has(file.type)) return fail("Use a JPEG, PNG, WebP or GIF image.");
  const path = `${gate.actorId}/admin-${Date.now()}.${extensionFor(file.type)}`;
  const uploaded = await gate.auth.admin.storage.from("identity-public").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploaded.error) return fail("Could not store that image. Try a smaller JPEG or PNG.");
  return { ok: true, id: path };
}

export async function adminCreatePerson(input: {
  phone: string;
  fullName: string;
  handle?: string;
  headline?: string;
  about?: string;
  city?: string;
  state?: string;
  occupationMode?: string;
  avatarPath?: string;
  coverPath?: string;
  website?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const fullName = input.fullName.trim();
  if (fullName.length < 2) return fail("Enter the person’s name.");
  const digits = normalizeIndianMobile(input.phone);
  if (!digits) return fail("Enter a valid Indian mobile number so they can sign in with WhatsApp later.");
  const occupation = OCCUPATION_MODES.has(input.occupationMode ?? "") ? input.occupationMode : "white_collar";
  const avatar = optionalMediaRef(input.avatarPath ?? "");
  if (!avatar.ok) return fail(avatar.error);
  const cover = optionalMediaRef(input.coverPath ?? "");
  if (!cover.ok) return fail(cover.error);
  const userId = await findOrCreateAuthUser(gate.auth.admin, digits, fullName);
  if (!userId) return fail("Could not create a sign-in account for that number.");
  const current = await gate.auth.admin.from("profiles").select("handle").eq("id", userId).maybeSingle();
  const requested = (input.handle ?? "").trim().toLowerCase().replace(/^@/, "");
  let desired = suggestedHandle(fullName);
  if (isValidHandle(requested)) desired = requested;
  else if (current.data?.handle && !current.data.handle.startsWith("u-")) desired = current.data.handle;
  const handle = await uniqueHandle(gate.auth.admin, desired, userId);
  const patch = {
    handle,
    full_name: fullName,
    headline: input.headline?.trim() || null,
    about: input.about?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    occupation_mode: occupation,
    avatar_path: avatar.value,
    cover_path: cover.value,
    website: input.website?.trim() || null,
  };
  const existingProfile = await gate.auth.admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  const saved = existingProfile.data
    ? await gate.auth.admin.from("profiles").update(patch).eq("id", userId)
    : await gate.auth.admin.from("profiles").insert({ id: userId, ...patch });
  if (saved.error) return fail("Could not save that person. Try a different handle.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_person", "profile", userId);
  revalidateAdmin();
  return { ok: true, id: userId };
}

export async function adminCreateOrganisation(input: {
  name: string;
  type: string;
  passportKind?: string;
  tagline?: string;
  about?: string;
  industry?: string;
  city?: string;
  state?: string;
  website?: string;
  categoryLabel?: string;
  servingRegions?: string;
  coverPath?: string;
  logoPath?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const name = input.name.trim();
  if (name.length < 2) return fail("Enter the organisation name.");
  const type = organisationTypes.includes(input.type as (typeof organisationTypes)[number])
    ? input.type
    : "employer";
  const passportKind = PASSPORT_KINDS.has(input.passportKind ?? "") ? input.passportKind : "other";
  const cover = optionalMediaRef(input.coverPath ?? "");
  if (!cover.ok) return fail(cover.error);
  const logo = optionalMediaRef(input.logoPath ?? "");
  if (!logo.ok) return fail(logo.error);
  const slug = slugify(name, "org");
  const created = await gate.auth.admin
    .from("organisations")
    .insert({
      slug,
      name,
      tagline: input.tagline?.trim() || null,
      about: input.about?.trim() || null,
      organisation_type: type,
      passport_kind: passportKind,
      industry: input.industry?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      website: input.website?.trim() || null,
      category_label: input.categoryLabel?.trim() || null,
      serving_regions: input.servingRegions?.trim() || null,
      cover_path: cover.value,
      logo_path: logo.value,
      created_by: gate.actorId,
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not create that organisation. Try a different name.");
  await gate.auth.admin.from("organisation_members").insert({
    organisation_id: created.data.id,
    profile_id: gate.actorId,
    role_title: "Owner",
    member_kind: "leadership",
    visibility: "public",
    org_role: "owner",
    invite_status: "active",
  });
  await operatorAudit(gate.auth.admin, gate.actorId, "create_organisation", "organisation", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateProject(input: {
  name: string;
  summary?: string;
  projectType?: string;
  status?: string;
  city?: string;
  state?: string;
  coverImageUrl?: string;
  youtubeUrl?: string;
  valueLabel?: string;
  durationLabel?: string;
  clientOrganisationId?: string;
  mainContractorId?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const name = input.name.trim();
  if (name.length < 2) return fail("Enter the project name.");
  const cover = optionalMediaRef(input.coverImageUrl ?? "");
  if (!cover.ok) return fail(cover.error);
  const youtube = optionalMediaRef(input.youtubeUrl ?? "");
  if (!youtube.ok) return fail(youtube.error);
  const created = await gate.auth.admin
    .from("network_projects")
    .insert({
      slug: slugify(name, "project"),
      name,
      summary: input.summary?.trim() || null,
      project_type: input.projectType?.trim() || null,
      status: PROJECT_STATUSES.has(input.status ?? "") ? input.status : "in_progress",
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      cover_image_url: cover.value,
      youtube_url: youtube.value,
      value_label: input.valueLabel?.trim() || null,
      duration_label: input.durationLabel?.trim() || null,
      client_organisation_id: input.clientOrganisationId || null,
      main_contractor_id: input.mainContractorId || null,
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not create that project.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_project", "project", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateJob(input: {
  organisationId: string;
  title: string;
  city?: string;
  employmentType?: string;
  experienceLabel?: string;
  salaryLabel?: string;
  skills?: string;
  description?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const title = input.title.trim();
  if (title.length < 2) return fail("Enter a job title.");
  if (!input.organisationId) return fail("Choose the hiring organisation.");
  const created = await gate.auth.admin
    .from("job_posts")
    .insert({
      organisation_id: input.organisationId,
      recruiter_profile_id: gate.actorId,
      title,
      city: input.city?.trim() || null,
      employment_type: JOB_TYPES.has(input.employmentType ?? "") ? input.employmentType : "permanent",
      experience_label: input.experienceLabel?.trim() || null,
      salary_label: input.salaryLabel?.trim() || null,
      skills: splitList(input.skills ?? ""),
      description: input.description?.trim() || null,
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not publish that job.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_job", "job", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateGig(input: {
  organisationId: string;
  title: string;
  trade?: string;
  siteName?: string;
  shiftLabel?: string;
  payLabel?: string;
  startLabel?: string;
  seats?: string;
  duration?: string;
  description?: string;
  projectId?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const title = input.title.trim();
  if (title.length < 2) return fail("Enter a gig title.");
  if (!input.organisationId) return fail("Choose the staffing organisation.");
  const seats = input.seats ? Number.parseInt(input.seats, 10) : null;
  const created = await gate.auth.admin
    .from("gig_posts")
    .insert({
      organisation_id: input.organisationId,
      title,
      trade: input.trade?.trim() || null,
      site_name: input.siteName?.trim() || null,
      shift_label: input.shiftLabel?.trim() || null,
      pay_label: input.payLabel?.trim() || null,
      start_label: input.startLabel?.trim() || null,
      seats: Number.isFinite(seats) ? seats : null,
      duration: GIG_DURATIONS.has(input.duration ?? "") ? input.duration : "1_day",
      description: input.description?.trim() || null,
      project_id: input.projectId || null,
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not publish that gig.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_gig", "gig", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreatePost(input: {
  authorProfileId?: string;
  authorOrganisationId?: string;
  body: string;
  postType?: string;
  imagePath?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const body = input.body.trim();
  if (!body) return fail("Write the post before publishing.");
  const profileId = input.authorProfileId || null;
  const organisationId = input.authorOrganisationId || null;
  if (Boolean(profileId) === Boolean(organisationId)) {
    return fail("Choose either a person or an organisation as the author.");
  }
  const created = await gate.auth.admin
    .from("posts")
    .insert({
      author_profile_id: profileId,
      author_organisation_id: organisationId,
      body,
      post_type: POST_TYPES.has(input.postType ?? "") ? input.postType : "update",
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not publish that post.");
  const image = optionalMediaRef(input.imagePath ?? "");
  if (!image.ok) return fail(image.error);
  if (image.value) {
    await gate.auth.admin.from("post_media").insert({
      post_id: created.data.id,
      storage_path: image.value,
    });
  }
  await operatorAudit(gate.auth.admin, gate.actorId, "create_post", "post", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateVerificationRequest(input: {
  profileId: string;
  kind: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!input.profileId) return fail("Choose a person.");
  if (!VERIFY_KINDS.has(input.kind)) return fail("Choose identity, employment or trade.");
  const created = await gate.auth.admin
    .from("verification_requests")
    .insert({
      profile_id: input.profileId,
      kind: input.kind,
      status: "pending",
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not file that verification request.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_verification_request", "verification_request", created.data.id);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateExperience(input: {
  profileId: string;
  title: string;
  organisationName?: string;
  locationLabel?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!input.profileId || input.title.trim().length < 2) return fail("Add a role title.");
  const created = await gate.auth.admin
    .from("professional_experiences")
    .insert({
      profile_id: input.profileId,
      title: input.title.trim(),
      organisation_name_text: input.organisationName?.trim() || null,
      location_label: input.locationLabel?.trim() || null,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      source: "self_declared",
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not add that experience.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_experience", "profile", input.profileId);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateCertification(input: {
  profileId: string;
  name: string;
  issuer?: string;
  category?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!input.profileId || input.name.trim().length < 2) return fail("Add a credential name.");
  const created = await gate.auth.admin
    .from("profile_certifications")
    .insert({
      profile_id: input.profileId,
      name: input.name.trim(),
      issuer: input.issuer?.trim() || null,
      category: CERT_CATEGORIES.has(input.category ?? "") ? input.category : "certification",
      verification_state: "self_declared",
      public_visible: true,
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not add that credential.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_certification", "profile", input.profileId);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}

export async function adminCreateOrgCredential(input: {
  organisationId: string;
  name: string;
  category?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!input.organisationId || input.name.trim().length < 2) return fail("Add a credential name.");
  const created = await gate.auth.admin
    .from("organisation_credentials")
    .insert({
      organisation_id: input.organisationId,
      name: input.name.trim(),
      category: input.category?.trim() || "licence",
      verification_state: "self_declared",
    })
    .select("id")
    .single();
  if (created.error || !created.data) return fail("Could not add that organisation credential.");
  await operatorAudit(gate.auth.admin, gate.actorId, "create_org_credential", "organisation", input.organisationId);
  revalidateAdmin();
  return { ok: true, id: created.data.id };
}
