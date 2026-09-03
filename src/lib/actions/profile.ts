"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import {
  aboutSchema,
  availabilitySchema,
  certificationSchema,
  experienceSchema,
  projectSchema,
  skillSchema,
} from "@/lib/domain/profile-schemas";

function revalidateProfile(handle: string | undefined) {
  revalidatePath(`/people/${handle ?? ""}`);
  revalidatePath("/passport");
  revalidatePath("/feed");
}

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "project"}-${crypto.randomUUID().slice(0, 8)}`;
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
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle);
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
  const { error } = await auth.supabase.from("professional_experiences").insert({
    profile_id: auth.ctx.userId,
    title: parsed.data.title,
    organisation_name_text: parsed.data.organisationName || null,
    location_label: parsed.data.locationLabel || null,
    start_date: parsed.data.startDate || null,
    end_date: parsed.data.endDate || null,
    source: "self_declared",
    responsibilities,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle);
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
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle);
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
    credential_id_public: parsed.data.credentialIdPublic || null,
    verification_state: "self_declared",
    public_visible: true,
  });
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle);
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
  const { error } = await auth.supabase
    .from("profiles")
    .update({
      availability_status: parsed.data.availabilityStatus,
      occupation_mode: parsed.data.occupationMode,
      city: parsed.data.city || null,
      preferred_roles: preferredRoles,
    })
    .eq("id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidateProfile(auth.ctx.profile?.handle);
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
  revalidateProfile(auth.ctx.profile?.handle);
  revalidatePath("/projects");
  return { ok: true };
}
