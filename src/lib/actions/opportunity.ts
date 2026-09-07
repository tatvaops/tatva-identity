"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { applicationStatusSchema, gigPostSchema, jobPostSchema } from "@/lib/domain/workspace-schemas";
import { applicationStatusLabel, canApplicantWithdraw, canOperatorTransition } from "@/lib/domain/application-lifecycle";
import { notify } from "@/lib/actions/notify";

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createJobPost(input: unknown): Promise<ActionResult> {
  const parsed = jobPostSchema.safeParse(input);
  if (!parsed.success) return fail("Add a job title before publishing.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const staff = await auth.supabase.rpc("is_org_staff", { org_id: parsed.data.organisationId });
  if (!staff.data) return fail("You cannot post jobs for this organisation.");
  const created = await auth.supabase
    .from("job_posts")
    .insert({
      organisation_id: parsed.data.organisationId,
      recruiter_profile_id: auth.ctx.userId,
      title: parsed.data.title,
      city: parsed.data.city || null,
      employment_type: parsed.data.employmentType,
      experience_label: parsed.data.experienceLabel || null,
      salary_label: parsed.data.salaryLabel || null,
      skills: splitList(parsed.data.skills),
      description: parsed.data.description || null,
      responsibilities: splitList(parsed.data.responsibilities ?? ""),
      requirements: splitList(parsed.data.requirements ?? ""),
      easy_apply: parsed.data.easyApply ?? false,
    })
    .select("id")
    .single();
  if (created.error) return fail(created.error.message);
  revalidatePath("/jobs");
  redirect(`/jobs/${created.data.id}`);
}

export async function createGigPost(input: unknown): Promise<ActionResult> {
  const parsed = gigPostSchema.safeParse(input);
  if (!parsed.success) return fail("Add a gig title before publishing.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const staff = await auth.supabase.rpc("is_org_staff", { org_id: parsed.data.organisationId });
  if (!staff.data) return fail("You cannot post gigs for this organisation.");
  const seats = parsed.data.seats ? Number.parseInt(parsed.data.seats, 10) : null;
  const created = await auth.supabase
    .from("gig_posts")
    .insert({
      organisation_id: parsed.data.organisationId,
      title: parsed.data.title,
      site_name: parsed.data.siteName || null,
      trade: parsed.data.trade || null,
      shift_label: parsed.data.shiftLabel || null,
      pay_label: parsed.data.payLabel || null,
      start_label: parsed.data.startLabel || null,
      seats: Number.isFinite(seats) ? seats : null,
      duration: parsed.data.duration,
      description: parsed.data.description || null,
      project_id: parsed.data.projectId || null,
      distance_km: parsed.data.distanceKm ? Number.parseFloat(parsed.data.distanceKm) : null,
    })
    .select("id")
    .single();
  if (created.error) return fail(created.error.message);
  revalidatePath("/gigs");
  redirect(`/gigs/${created.data.id}`);
}

export async function updateJobApplicationStatus(input: unknown): Promise<ActionResult> {
  const parsed = applicationStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a valid application status.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const status = parsed.data.status === "hired" ? "accepted" : parsed.data.status;
  const current = await auth.supabase
    .from("job_applications")
    .select("id, profile_id, status, job_id, job_posts(title)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!current.data) return fail("That application is no longer available.");
  if (!canOperatorTransition(String(current.data.status ?? "submitted"), status)) {
    return fail("That application can no longer change status.");
  }
  const { error } = await auth.supabase.from("job_applications").update({ status }).eq("id", parsed.data.id);
  if (error) return fail(error.message);
  const job = current.data?.job_posts as unknown as { title?: string } | null;
  await notify(
    auth.supabase,
    current.data?.profile_id,
    "application",
    "Job application updated",
    `${job?.title ?? "A job"} is now ${applicationStatusLabel(status)}.`,
    "/applications",
  );
  revalidatePath("/jobs");
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateGigApplicationStatus(input: unknown): Promise<ActionResult> {
  const parsed = applicationStatusSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a valid application status.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const status = parsed.data.status === "hired" ? "accepted" : parsed.data.status;
  const current = await auth.supabase
    .from("gig_applications")
    .select("id, profile_id, status, gig_id, gig_posts(title)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!current.data) return fail("That application is no longer available.");
  if (!canOperatorTransition(String(current.data.status ?? "submitted"), status)) {
    return fail("That application can no longer change status.");
  }
  const { error } = await auth.supabase.from("gig_applications").update({ status }).eq("id", parsed.data.id);
  if (error) return fail(error.message);
  const gig = current.data?.gig_posts as unknown as { title?: string } | null;
  await notify(
    auth.supabase,
    current.data?.profile_id,
    "application",
    "Gig application updated",
    `${gig?.title ?? "A gig"} is now ${applicationStatusLabel(status)}.`,
    "/applications",
  );
  revalidatePath("/gigs");
  revalidatePath("/applications");
  return { ok: true };
}

export async function withdrawApplication(kind: "job" | "gig", id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail("That application is no longer available.");
  const table = kind === "job" ? "job_applications" : "gig_applications";
  const existing = await auth.supabase.from(table).select("id, status").eq("id", id).eq("profile_id", auth.ctx.userId).maybeSingle();
  if (!existing.data) return fail("That application is no longer available.");
  if (!canApplicantWithdraw(String(existing.data.status ?? "submitted"))) {
    return fail("This application can no longer be withdrawn.");
  }
  const { error } = await auth.supabase.from(table).update({ status: "withdrawn" }).eq("id", id).eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/gigs");
  return { ok: true };
}

export async function updateJobPost(input: unknown): Promise<ActionResult> {
  const parsed = jobPostSchema.safeParse(input);
  if (!parsed.success || !parsed.data.jobId) return fail("Save the job details, then try again.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase
    .from("job_posts")
    .update({
      title: parsed.data.title,
      city: parsed.data.city || null,
      employment_type: parsed.data.employmentType,
      experience_label: parsed.data.experienceLabel || null,
      salary_label: parsed.data.salaryLabel || null,
      skills: splitList(parsed.data.skills),
      description: parsed.data.description || null,
      responsibilities: splitList(parsed.data.responsibilities ?? ""),
      requirements: splitList(parsed.data.requirements ?? ""),
      easy_apply: parsed.data.easyApply ?? false,
    })
    .eq("id", parsed.data.jobId);
  if (error) return fail(error.message);
  revalidatePath(`/jobs/${parsed.data.jobId}`);
  redirect(`/jobs/${parsed.data.jobId}`);
}

export async function closeJobPost(jobId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("job_posts").update({ closed_at: new Date().toISOString() }).eq("id", jobId);
  if (error) return fail(error.message);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function reopenJobPost(jobId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("job_posts").update({ closed_at: null }).eq("id", jobId);
  if (error) return fail(error.message);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  return { ok: true };
}

export async function closeGigPost(gigId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("gig_posts").update({ closed_at: new Date().toISOString() }).eq("id", gigId);
  if (error) return fail(error.message);
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

export async function reopenGigPost(gigId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const { error } = await auth.supabase.from("gig_posts").update({ closed_at: null }).eq("id", gigId);
  if (error) return fail(error.message);
  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  return { ok: true };
}

export async function updateGigPost(input: unknown): Promise<ActionResult> {
  const parsed = gigPostSchema.safeParse(input);
  if (!parsed.success || !parsed.data.gigId) return fail("Save the gig details, then try again.");
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const seats = parsed.data.seats ? Number.parseInt(parsed.data.seats, 10) : null;
  const { error } = await auth.supabase
    .from("gig_posts")
    .update({
      title: parsed.data.title,
      site_name: parsed.data.siteName || null,
      trade: parsed.data.trade || null,
      shift_label: parsed.data.shiftLabel || null,
      pay_label: parsed.data.payLabel || null,
      start_label: parsed.data.startLabel || null,
      seats: Number.isFinite(seats) ? seats : null,
      duration: parsed.data.duration,
      description: parsed.data.description || null,
      project_id: parsed.data.projectId || null,
      distance_km: parsed.data.distanceKm ? Number.parseFloat(parsed.data.distanceKm) : null,
    })
    .eq("id", parsed.data.gigId);
  if (error) return fail(error.message);
  revalidatePath(`/gigs/${parsed.data.gigId}`);
  redirect(`/gigs/${parsed.data.gigId}`);
}

