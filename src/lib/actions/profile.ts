"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import {
  aboutSchema,
  availabilitySchema,
  certificationSchema,
  educationSchema,
  endorsementSchema,
  evidenceItemSchema,
  experienceSchema,
  handleSchema,
  notificationPrefsSchema,
  onboardingSchema,
  privacySchema,
  portfolioItemSchema,
  profileServiceSchema,
  projectSchema,
  recordIdSchema,
  skillFactSchema,
  skillSchema,
  verificationRequestSchema,
} from "@/lib/domain/profile-schemas";
import { notify } from "@/lib/actions/notify";
import { slugify } from "@/lib/domain/slug";
import { personPublicHref } from "@/lib/domain/identiti-routes";
import { handleIsGenerated, handleIsReserved, normalizeHandle } from "@/lib/domain/onboarding";
import type { OccupationMode } from "@/lib/types/identity";

function revalidateProfile(handle: string | undefined, occupationMode?: OccupationMode | string | null) {
  const resolved = handle ?? "";
  revalidatePath(`/people/${resolved}`);
  revalidatePath("/passport");
  revalidatePath(`/passport/${resolved}`);
  revalidatePath("/feed");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  if (resolved) {
    revalidatePath(personPublicHref(resolved, occupationMode));
    revalidatePath(`/professionals/${resolved}`);
    revalidatePath(`/gig-workers/${resolved}`);
  }
}

async function claimHandle(
  supabase: NonNullable<Awaited<ReturnType<typeof requireUser>>["supabase"]>,
  userId: string,
  raw: string,
) {
  const handle = normalizeHandle(raw);
  const parsed = handleSchema.safeParse(handle);
  if (!parsed.success || handleIsReserved(handle) || handleIsGenerated(handle)) {
    return { error: "Choose a public handle with 3–64 letters, numbers or hyphens." as const, handle: null };
  }
  const existing = await supabase.from("profiles").select("id").eq("handle", handle).maybeSingle();
  if (existing.data && existing.data.id !== userId) {
    return { error: "That handle is already in use." as const, handle: null };
  }
  return { error: null, handle };
}

export async function updateProfileAbout(input: unknown): Promise<ActionResult> {
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return fail("Check headline and about, then try again.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      headline: parsed.data.headline || null,
      about: parsed.data.about || null,
      full_name: parsed.data.fullName || undefined,
      website: parsed.data.website || null,
      languages: parsed.data.languages
        ? parsed.data.languages.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
        : undefined,
      preferred_work_locations: parsed.data.preferredWorkLocations
        ? parsed.data.preferredWorkLocations.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
        : undefined,
      locality: parsed.data.locality || undefined,
      state: parsed.data.state || undefined,
      willing_to_relocate: parsed.data.willingToRelocate ?? undefined,
      willing_to_travel: parsed.data.willingToTravel ?? undefined,
      arrangement: parsed.data.arrangement || undefined,
      email_visible_to: parsed.data.emailVisibleTo || undefined,
      about_visible_to: parsed.data.aboutVisibleTo || undefined,
      location_visible_to: parsed.data.locationVisibleTo || undefined,
      professional_title: parsed.data.professionalTitle || undefined,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addExperience(input: unknown): Promise<ActionResult> {
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return fail("Add a role title before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const responsibilities = parsed.data.responsibilities
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter(Boolean);
  const isCurrent = Boolean(parsed.data.isCurrent) || !parsed.data.endDate;
  const { error } = await auth.supabase.from("professional_experiences").insert({
    profile_id: auth.ctx.userId,
    title: parsed.data.title,
    organisation_name_text: parsed.data.organisationName || null,
    location_label: parsed.data.locationLabel || null,
    start_date: parsed.data.startDate || null,
    end_date: isCurrent ? null : parsed.data.endDate || null,
    is_current: isCurrent,
    source: "self_declared",
    responsibilities,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addSkill(input: unknown): Promise<ActionResult> {
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return fail("Add a skill name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const name = parsed.data.name;
  const existing = await auth.supabase.from("skills").select("id").ilike("name", name).limit(1).maybeSingle();
  if (existing.error) return fail(existing.error.message);
  let skillId = existing.data?.id ?? null;
  if (!skillId) {
    const created = await auth.supabase.from("skills").insert({ name }).select("id").single();
    if (created.error) return fail(created.error.message);
    skillId = created.data.id;
  }
  const { error } = await auth.supabase.from("profile_skills").insert({
    profile_id: auth.ctx.userId,
    skill_id: skillId,
    verification_level: "self_declared",
    category: parsed.data.category || null,
    years_experience: parsed.data.yearsExperience ? Number.parseFloat(parsed.data.yearsExperience) : null,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addCertification(input: unknown): Promise<ActionResult> {
  const parsed = certificationSchema.safeParse(input);
  if (!parsed.success) return fail("Add a credential name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("profile_certifications").insert({
    profile_id: auth.ctx.userId,
    name: parsed.data.name,
    issuer: parsed.data.issuer || null,
    issue_date: parsed.data.issueDate || null,
    expiry_date: parsed.data.expiryDate || null,
    credential_id_public: parsed.data.credentialIdPublic || null,
    category: parsed.data.category,
    verification_state: "self_declared",
    public_visible: true,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function updateAvailability(input: unknown): Promise<ActionResult> {
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return fail("Choose a valid availability status.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const preferredRoles = parsed.data.preferredRoles
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const daily = parsed.data.dailyRateInr ? Number.parseInt(parsed.data.dailyRateInr, 10) : null;
  const monthly = parsed.data.monthlySalaryInr ? Number.parseInt(parsed.data.monthlySalaryInr, 10) : null;
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      availability_status: parsed.data.availabilityStatus,
      occupation_mode: parsed.data.occupationMode,
      city: parsed.data.city || null,
      preferred_roles: preferredRoles,
      daily_rate_inr: Number.isFinite(daily) ? daily : null,
      monthly_salary_inr: Number.isFinite(monthly) ? monthly : null,
      notice_period: parsed.data.noticePeriod || null,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addOptedInProject(input: unknown): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail("Add a project name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const created = await auth.supabase
    .from("network_projects")
    .insert({
      slug: slugify(parsed.data.name),
      name: parsed.data.name,
      summary: parsed.data.summary || null,
      city: parsed.data.city || null,
      verified: false,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (created.error) return fail(created.error.message);
  const link = await auth.supabase.from("project_contributors").insert({
    project_id: created.data.id,
    profile_id: auth.ctx.userId,
    role_title: parsed.data.roleTitle || null,
    opted_in: true,
  });
  if (link.error) return fail(link.error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  revalidatePath("/projects");
  return { ok: true };
}

export async function addProfileService(input: unknown): Promise<ActionResult> {
  const parsed = profileServiceSchema.safeParse(input);
  if (!parsed.success) return fail("Add a service name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("profile_services").insert({
    profile_id: auth.ctx.userId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    locations: parsed.data.locations.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean),
    availability_label: parsed.data.availabilityLabel || null,
    category: parsed.data.category || null,
    pricing_model: parsed.data.pricingModel || null,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function requestVerification(input: unknown): Promise<ActionResult> {
  const parsed = verificationRequestSchema.safeParse(input);
  if (!parsed.success) return fail("Choose what you want verified.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("verification_requests").insert({
    profile_id: auth.ctx.userId,
    kind: parsed.data.kind,
    status: "pending",
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function endorseSkill(input: unknown): Promise<ActionResult> {
  const parsed = endorsementSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a skill to endorse.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const skill = await auth.supabase
    .from("profile_skills")
    .select("id, profile_id, verification_level")
    .eq("id", parsed.data.profileSkillId)
    .maybeSingle();
  if (!skill.data || skill.data.profile_id === auth.ctx.userId) return fail("You can only endorse someone else's skill.");
  const { error } = await auth.supabase.from("endorsements").insert({
    profile_skill_id: parsed.data.profileSkillId,
    endorser_id: auth.ctx.userId,
  });
  if (error) return fail(error.message);
  await auth.supabase.from("skill_verifications").insert({
    profile_skill_id: parsed.data.profileSkillId,
    kind: "community",
    verifier_profile_id: auth.ctx.userId,
    explanation: "Community endorsement.",
  });
  if (skill.data.verification_level === "self_declared") {
    await auth.supabase
      .from("profile_skills")
      .update({ verification_level: "community_endorsed" })
      .eq("id", parsed.data.profileSkillId);
  }
  const person = await auth.supabase
    .from("public_profiles")
    .select("handle, occupation_mode")
    .eq("id", skill.data.profile_id)
    .maybeSingle();
  await notify(
    auth.supabase,
    skill.data.profile_id,
    "endorsement",
    "A skill was endorsed",
    undefined,
    person.data?.handle ? personPublicHref(person.data.handle, person.data.occupation_mode) : "/professionals",
  );
  revalidatePath("/people");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  return { ok: true };
}

function onboardingUpdates(parsed: {
  fullName: string;
  headline?: string;
  about?: string;
  city?: string;
  state?: string;
  occupationMode: OccupationMode;
  languages?: string;
  specialisation?: string;
  professionalTitle?: string;
  availabilityStatus?: string;
  step?: number;
  markComplete?: boolean;
}) {
  const updates: Record<string, unknown> = {
    full_name: parsed.fullName,
    headline: parsed.headline || null,
    about: parsed.about || null,
    city: parsed.city || null,
    state: parsed.state || null,
    occupation_mode: parsed.occupationMode,
  };
  if (parsed.languages !== undefined) {
    updates.languages = parsed.languages.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }
  if (parsed.specialisation !== undefined) updates.specialisation = parsed.specialisation || null;
  if (parsed.professionalTitle) updates.professional_title = parsed.professionalTitle;
  if (parsed.availabilityStatus) updates.availability_status = parsed.availabilityStatus;
  if (typeof parsed.step === "number") updates.onboarding_step = parsed.step;
  if (parsed.markComplete) updates.onboarding_completed_at = new Date().toISOString();
  return updates;
}

export async function saveOnboardingProgress(input: unknown): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return fail("Add your name and professional category to continue.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const updates = onboardingUpdates({ ...parsed.data, markComplete: false });
  if (!parsed.data.skipHandle && parsed.data.handle) {
    const claimed = await claimHandle(auth.supabase, auth.ctx.userId, parsed.data.handle);
    if (claimed.error || !claimed.handle) return fail(claimed.error ?? "That handle is not available.");
    updates.handle = claimed.handle;
  }
  const { error } = await auth.supabase.from("profiles").update(updates).eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  const nextHandle = typeof updates.handle === "string" ? updates.handle : auth.ctx.profile?.handle;
  revalidateProfile(nextHandle, parsed.data.occupationMode);
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return fail("Add your name and professional category to continue.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const updates = onboardingUpdates({ ...parsed.data, markComplete: parsed.data.markComplete !== false });
  if (!parsed.data.skipHandle && parsed.data.handle) {
    const claimed = await claimHandle(auth.supabase, auth.ctx.userId, parsed.data.handle);
    if (claimed.error || !claimed.handle) return fail(claimed.error ?? "That handle is not available.");
    updates.handle = claimed.handle;
  }
  const { error } = await auth.supabase.from("profiles").update(updates).eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  const nextHandle = typeof updates.handle === "string" ? updates.handle : auth.ctx.profile?.handle;
  revalidateProfile(nextHandle, parsed.data.occupationMode);
  revalidatePath("/onboarding");
  return { ok: true };
}

export async function bootstrapOwnProfile(): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (auth.ctx.profile) {
    revalidatePath("/onboarding");
    return { ok: true };
  }
  return fail("Could not create your passport. Try again.");
}

export async function addEvidenceItem(input: unknown): Promise<ActionResult> {
  const parsed = evidenceItemSchema.safeParse(input);
  if (!parsed.success) return fail("Add a short note or photo before saving evidence.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const hasMedia = Boolean(parsed.data.mediaPath);
  const { error } = await auth.supabase.from("evidence_items").insert({
    profile_id: auth.ctx.userId,
    claim_kind: parsed.data.claimKind,
    claim_id: parsed.data.claimId || null,
    media_path: parsed.data.mediaPath || null,
    note: parsed.data.note || null,
    verification_state: hasMedia ? "evidence_backed" : "self_declared",
    is_public: true,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeEvidenceItem(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose an evidence record to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("evidence_items")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function updateProfileHandle(input: unknown): Promise<ActionResult> {
  const parsed = handleSchema.safeParse(typeof input === "string" ? input : (input as { handle?: string })?.handle);
  if (!parsed.success) return fail("Use 3–64 letters, numbers or hyphens for your handle.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const claimed = await claimHandle(auth.supabase, auth.ctx.userId, parsed.data);
  if (claimed.error || !claimed.handle) return fail(claimed.error ?? "That handle is not available.");
  const previous = auth.ctx.profile?.handle;
  const { error } = await auth.supabase.from("profiles").update({ handle: claimed.handle }).eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(previous, auth.ctx.profile?.occupationMode);
  revalidateProfile(claimed.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeExperience(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose an experience record to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("professional_experiences")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeSkill(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a skill to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profile_skills")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeCertification(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a credential to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profile_certifications")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeProfileService(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a service to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profile_services")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  revalidatePath("/services");
  return { ok: true };
}

export async function addPortfolioItem(input: unknown): Promise<ActionResult> {
  const parsed = portfolioItemSchema.safeParse(input);
  if (!parsed.success) return fail("Add a work photo before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("work_portfolio_items").insert({
    profile_id: auth.ctx.userId,
    kind: "photo",
    image_url: parsed.data.imageUrl,
    caption: parsed.data.caption || null,
    work_category: parsed.data.workCategory || null,
    location: parsed.data.location || null,
    supervisor_verified: false,
    brand_verified: false,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removePortfolioItem(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a work photo to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("work_portfolio_items")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addSkillFact(input: unknown): Promise<ActionResult> {
  const parsed = skillFactSchema.safeParse(input);
  if (!parsed.success) return fail("Add a skill name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const years = parsed.data.yearsExperience ? Number.parseFloat(parsed.data.yearsExperience) : null;
  const { error } = await auth.supabase.from("skill_passport_facts").insert({
    profile_id: auth.ctx.userId,
    skill_name: parsed.data.skillName,
    years_experience: Number.isFinite(years) ? years : null,
    tools_owned: parsed.data.tools
      ? parsed.data.tools.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
      : [],
    proficiency: parsed.data.proficiency || null,
    verified_projects: 0,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function removeSkillFact(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a skill fact to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("skill_passport_facts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function addEducation(input: unknown): Promise<ActionResult> {
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return fail("Add an institution before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("profile_education").insert({
    profile_id: auth.ctx.userId,
    institution: parsed.data.institution,
    qualification: parsed.data.qualification || null,
    course: parsed.data.course || null,
    field_of_study: parsed.data.fieldOfStudy || null,
    start_date: parsed.data.startDate || null,
    end_date: parsed.data.endDate || null,
    credential_id_public: parsed.data.credentialIdPublic || null,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  revalidatePath("/passport");
  return { ok: true };
}

export async function removeEducation(input: unknown): Promise<ActionResult> {
  const parsed = recordIdSchema.safeParse(input);
  if (!parsed.success) return fail("Choose an education record to remove.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profile_education")
    .delete()
    .eq("id", parsed.data.id)
    .eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function updatePrivacy(input: unknown): Promise<ActionResult> {
  const parsed = privacySchema.safeParse(input);
  if (!parsed.success) return fail("Choose valid visibility settings.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      about_visible_to: parsed.data.aboutVisibleTo,
      location_visible_to: parsed.data.locationVisibleTo,
      email_visible_to: parsed.data.emailVisibleTo,
      availability_visible_to: parsed.data.availabilityVisibleTo,
      connections_visible_to: parsed.data.connectionsVisibleTo,
      activity_visible_to: parsed.data.activityVisibleTo,
      projects_visible_to: parsed.data.projectsVisibleTo,
      experience_visible_to: parsed.data.experienceVisibleTo,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/settings");
  revalidateProfile(auth.ctx.profile?.handle, auth.ctx.profile?.occupationMode);
  return { ok: true };
}

export async function updateNotificationPrefs(input: unknown): Promise<ActionResult> {
  const parsed = notificationPrefsSchema.safeParse(input);
  if (!parsed.success) return fail("Save notification preferences, then try again.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      notify_connections: parsed.data.notifyConnections,
      notify_messages: parsed.data.notifyMessages,
      notify_applications: parsed.data.notifyApplications,
      notify_social: parsed.data.notifySocial,
      notify_organisation: parsed.data.notifyOrganisation,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/settings");
  return { ok: true };
}

export async function skipRemainingOnboarding(): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const name = auth.ctx.profile?.fullName?.trim();
  if (!name || name === "New professional") return fail("Add your name before leaving onboarding.");
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 14,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/onboarding");
  revalidatePath("/feed");
  return { ok: true };
}
