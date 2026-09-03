"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { slugify } from "@/lib/domain/slug";
import { organisationSchema, orgCredentialSchema, orgServiceSchema } from "@/lib/domain/workspace-schemas";

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
    });
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
