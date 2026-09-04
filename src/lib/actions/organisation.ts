"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { slugify } from "@/lib/domain/slug";
import { organisationSchema, orgCredentialSchema, orgMemberSchema, orgServiceSchema, reviewSchema } from "@/lib/domain/workspace-schemas";
import { notify } from "@/lib/actions/notify";

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createOrganisation(input: unknown): Promise<ActionResult> {
  const parsed = organisationSchema.safeParse(input);
  if (!parsed.success) return fail("Add an organisation name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const slug = slugify(parsed.data.name, "org");
  const foundedYear = parsed.data.foundedYear ? Number.parseInt(parsed.data.foundedYear, 10) : null;
  const created = await auth.supabase.from("organisations").insert({
    slug,
    name: parsed.data.name,
    tagline: parsed.data.tagline || null,
    about: parsed.data.about || null,
    organisation_type: parsed.data.type,
    industry: parsed.data.industry || null,
    city: parsed.data.city || null,
    locality: parsed.data.locality || null,
    founded_year: Number.isFinite(foundedYear) ? foundedYear : null,
    website: parsed.data.website || null,
    public_phone: parsed.data.publicPhone || null,
    public_email: parsed.data.publicEmail || null,
    office_locality: parsed.data.officeLocality || null,
    service_areas: splitList(parsed.data.serviceAreas ?? ""),
    team_size_label: parsed.data.teamSizeLabel || null,
    state: parsed.data.state || null,
    created_by: auth.ctx.userId,
  });
  if (created.error) return fail(created.error.message);
  const org = await auth.supabase.from("organisations").select("id").eq("slug", slug).maybeSingle();
  if (org.data?.id) {
    await auth.supabase.from("organisation_members").insert({
      organisation_id: org.data.id,
      profile_id: auth.ctx.userId,
      role_title: "Owner",
      member_kind: "leadership",
      visibility: "public",
      org_role: "owner",
      invite_status: "active",
    });
    await auth.supabase.from("profiles").update({ current_organisation_id: org.data.id }).eq("id", auth.ctx.userId);
  }
  revalidatePath("/companies");
  redirect(`/companies/${slug}`);
}

export async function updateOrganisation(slug: string, input: unknown): Promise<ActionResult> {
  const parsed = organisationSchema.safeParse(input);
  if (!parsed.success) return fail("Check the organisation details, then try again.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const foundedYear = parsed.data.foundedYear ? Number.parseInt(parsed.data.foundedYear, 10) : null;
  const { error } = await auth.supabase
    .from("organisations")
    .update({
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      about: parsed.data.about || null,
      organisation_type: parsed.data.type,
      industry: parsed.data.industry || null,
      city: parsed.data.city || null,
      locality: parsed.data.locality || null,
      founded_year: Number.isFinite(foundedYear) ? foundedYear : null,
      website: parsed.data.website || null,
      public_phone: parsed.data.publicPhone || null,
      public_email: parsed.data.publicEmail || null,
      office_locality: parsed.data.officeLocality || null,
      service_areas: splitList(parsed.data.serviceAreas ?? ""),
      team_size_label: parsed.data.teamSizeLabel || null,
      state: parsed.data.state || null,
    })
    .eq("slug", slug)
    .eq("created_by", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath(`/companies/${slug}`);
  revalidatePath(`/org/${slug}`);
  return { ok: true };
}

export async function addOrganisationService(input: unknown): Promise<ActionResult> {
  const parsed = orgServiceSchema.safeParse(input);
  if (!parsed.success) return fail("Add a service name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("organisation_services").insert({
    organisation_id: parsed.data.organisationId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    locations: splitList(parsed.data.locations),
    pricing_model: parsed.data.pricingModel || null,
  });
  if (error) return fail(error.message);
  revalidatePath("/companies");
  revalidatePath("/services");
  return { ok: true };
}

export async function addOrganisationCredential(input: unknown): Promise<ActionResult> {
  const parsed = orgCredentialSchema.safeParse(input);
  if (!parsed.success) return fail("Add a credential name before saving.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("organisation_credentials").insert({
    organisation_id: parsed.data.organisationId,
    name: parsed.data.name,
    category: parsed.data.category,
    verification_state: "not_submitted",
    public_visible: true,
  });
  if (error) return fail(error.message);
  revalidatePath("/companies");
  return { ok: true };
}

export async function inviteOrganisationMember(input: unknown): Promise<ActionResult> {
  const parsed = orgMemberSchema.safeParse(input);
  if (!parsed.success) return fail("Add a person handle before inviting.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const person = await auth.supabase.from("public_profiles").select("id, handle").eq("handle", parsed.data.handle.replace(/^@/, "")).maybeSingle();
  if (!person.data) return fail("No public profile uses that handle.");
  const { error } = await auth.supabase.from("organisation_members").insert({
    organisation_id: parsed.data.organisationId,
    profile_id: person.data.id,
    role_title: parsed.data.roleTitle || null,
    department: parsed.data.department || null,
    org_role: parsed.data.orgRole,
    visibility: parsed.data.visibility,
    invite_status: "invited",
    member_kind: parsed.data.orgRole === "admin" ? "leadership" : "employee",
  });
  if (error) return fail(error.message);
  await notify(auth.supabase, person.data.id, "org_invite", "Organisation invitation", parsed.data.roleTitle || "You've been invited to an organisation.", `/people/${person.data.handle}`);
  revalidatePath("/companies");
  return { ok: true };
}

export async function writeOrganisationReview(input: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Write a review from work you actually shared.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("reviews").insert({
    organisation_id: parsed.data.organisationId,
    project_id: parsed.data.projectId || null,
    reviewer_profile_id: auth.ctx.userId,
    reviewer_name: auth.ctx.profile?.fullName ?? null,
    relationship: parsed.data.relationship,
    rating: parsed.data.rating,
    body: parsed.data.body,
  });
  if (error) return fail(error.message);
  revalidatePath("/companies");
  return { ok: true };
}
