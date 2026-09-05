"use server";

import { limitAction, notify } from "@/lib/actions/notify";
import { fail, type ActionResult } from "@/lib/actions/shared";
import { requirePlatformAdminResult } from "@/lib/admin/access";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
  revalidatePath("/people");
  revalidatePath("/companies");
  revalidatePath("/feed");
  revalidatePath("/jobs");
  revalidatePath("/gigs");
  revalidatePath("/projects");
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

export async function adminSetProfileVerification(
  profileId: string,
  flag: "identity" | "employment" | "trade",
  value: boolean,
): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const patch: Record<string, boolean> = {};
  if (flag === "identity") patch.identity_verified = value;
  if (flag === "employment") patch.employment_verified = value;
  if (flag === "trade") patch.trade_verified = value;
  const { error } = await gate.auth.admin.from("profiles").update(patch).eq("id", profileId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "set_profile_verification", "profile", profileId);
  const person = await gate.auth.admin.from("profiles").select("handle").eq("id", profileId).maybeSingle();
  await notify(
    gate.auth.supabase,
    profileId,
    "verification",
    "Verification updated",
    "A platform operator updated a verification flag on your passport.",
    `/people/${person.data?.handle ?? ""}`,
  );
  revalidateAdmin();
  return { ok: true };
}

export async function adminHideProfile(profileId: string, hidden: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (profileId === gate.actorId) return fail("You cannot hide your own operator profile.");
  const { error } = await gate.auth.admin.from("profiles").update({ admin_hidden: hidden }).eq("id", profileId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, hidden ? "hide_profile" : "unhide_profile", "profile", profileId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminHideOrganisation(organisationId: string, hidden: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin.from("organisations").update({ admin_hidden: hidden }).eq("id", organisationId);
  if (error) return fail(error.message);
  await operatorAudit(
    gate.auth.admin,
    gate.actorId,
    hidden ? "hide_organisation" : "unhide_organisation",
    "organisation",
    organisationId,
  );
  revalidateAdmin();
  return { ok: true };
}

export async function adminHidePost(postId: string, hidden: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin
    .from("posts")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", postId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, hidden ? "hide_post" : "unhide_post", "post", postId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminReviewVerification(input: {
  requestId: string;
  approve: boolean;
  note?: string;
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const request = await gate.auth.admin.from("verification_requests").select("*").eq("id", input.requestId).maybeSingle();
  if (!request.data) return fail("That verification request is no longer available.");
  const status = input.approve ? "approved" : "declined";
  const { error } = await gate.auth.admin
    .from("verification_requests")
    .update({
      status,
      reviewer_note: input.note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: gate.actorId,
    })
    .eq("id", input.requestId);
  if (error) return fail(error.message);
  if (input.approve && request.data.profile_id) {
    const kind = String(request.data.kind);
    const flags: Record<string, boolean> = {};
    if (kind === "identity") flags.identity_verified = true;
    if (kind === "employment") flags.employment_verified = true;
    if (kind === "trade") flags.trade_verified = true;
    if (Object.keys(flags).length > 0) {
      await gate.auth.admin.from("profiles").update(flags).eq("id", request.data.profile_id);
    }
  }
  await operatorAudit(gate.auth.admin, gate.actorId, `verification_${status}`, "verification_request", input.requestId);
  if (request.data.profile_id) {
    await notify(
      gate.auth.supabase,
      request.data.profile_id,
      "verification",
      input.approve ? "Verification approved" : "Verification declined",
      input.note || undefined,
      "/passport",
    );
  }
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetCertificationState(id: string, state: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const allowed = ["verified", "pending", "expired", "revoked", "not_submitted", "self_declared"];
  if (!allowed.includes(state)) return fail("Choose a valid credential state.");
  const { error } = await gate.auth.admin.from("profile_certifications").update({ verification_state: state }).eq("id", id);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "set_certification_state", "profile_certification", id);
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetOrgCredentialState(id: string, state: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const allowed = ["verified", "pending", "expired", "not_submitted"];
  if (!allowed.includes(state)) return fail("Choose a valid credential state.");
  const { error } = await gate.auth.admin.from("organisation_credentials").update({ verification_state: state }).eq("id", id);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "set_org_credential_state", "organisation_credential", id);
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetProjectVerified(projectId: string, verified: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin.from("network_projects").update({ verified }).eq("id", projectId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, verified ? "verify_project" : "unverify_project", "project", projectId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminCloseJob(jobId: string, closed: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin
    .from("job_posts")
    .update({ closed_at: closed ? new Date().toISOString() : null })
    .eq("id", jobId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, closed ? "close_job" : "reopen_job", "job", jobId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminCloseGig(gigId: string, closed: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin
    .from("gig_posts")
    .update({ closed_at: closed ? new Date().toISOString() : null })
    .eq("id", gigId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, closed ? "close_gig" : "reopen_gig", "gig", gigId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetSeedEnabled(enabled: boolean): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin
    .from("platform_settings")
    .update({ seed_data_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return fail(error.message);
  await operatorAudit(
    gate.auth.admin,
    gate.actorId,
    enabled ? "show_demo_data" : "hide_demo_data",
    "platform_settings",
    "00000000-0000-0000-0000-000000000001",
  );
  revalidateAdmin();
  return { ok: true };
}

export async function adminGrantOperator(handle: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const cleaned = handle.replace(/^@/, "").trim().toLowerCase();
  if (!cleaned) return fail("Enter a profile handle.");
  const person = await gate.auth.admin.from("profiles").select("id, handle, full_name").eq("handle", cleaned).maybeSingle();
  if (!person.data) return fail("No profile uses that handle.");
  const { error } = await gate.auth.admin.from("platform_admins").insert({
    profile_id: person.data.id,
    granted_by: gate.actorId,
  });
  if (error) {
    if (error.code === "23505") return fail("That person is already an operator.");
    return fail(error.message);
  }
  await operatorAudit(gate.auth.admin, gate.actorId, "grant_operator", "profile", person.data.id);
  await notify(
    gate.auth.supabase,
    person.data.id,
    "admin",
    "Operations access",
    "You can open the platform operations console.",
    "/admin",
  );
  revalidateAdmin();
  return { ok: true };
}

export async function adminRevokeOperator(profileId: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (profileId === gate.actorId) return fail("You cannot revoke your own access.");
  const { count } = await gate.auth.admin.from("platform_admins").select("profile_id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return fail("Keep at least one platform operator.");
  const { error } = await gate.auth.admin.from("platform_admins").delete().eq("profile_id", profileId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "revoke_operator", "profile", profileId);
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetAiReviewSource(
  organisationId: string,
  source: "google_reviews" | "vantage_forum",
  enabled: boolean,
): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin.from("organisation_ai_review_settings").upsert({
    organisation_id: organisationId,
    ai_review_source: source,
    ai_review_enabled: enabled,
  });
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "set_ai_review_source", "organisation", organisationId);
  revalidateAdmin();
  revalidatePath("/service-brands");
  revalidatePath("/product-brands");
  return { ok: true };
}

export async function adminSaveForumLink(input: {
  id?: string;
  entityType: string;
  entityId: string;
  threadSlug: string;
  canonicalUrl: string;
  status: "pending" | "active" | "failed";
}): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!["service_brand", "product_brand", "product"].includes(input.entityType)) return fail("Choose a valid entity type.");
  const patch = {
    entity_type: input.entityType,
    entity_id: input.entityId,
    thread_slug: input.threadSlug || null,
    canonical_url: input.canonicalUrl || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  const { error } = input.id
    ? await gate.auth.admin.from("forum_entity_links").update(patch).eq("id", input.id)
    : await gate.auth.admin.from("forum_entity_links").insert(patch);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "save_forum_link", "forum_entity_link", input.entityId);
  revalidateAdmin();
  revalidatePath("/forums");
  return { ok: true };
}

export async function adminMintCredential(name: string, kind: "read" | "write"): Promise<ActionResult & { token?: string }> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { randomBytes } = await import("node:crypto");
  const { credentialScopes, hashCredential } = await import("@/lib/domain/forum-token");
  const token = randomBytes(32).toString("hex");
  const { error } = await gate.auth.admin.from("api_credentials").insert({
    name: name.trim() || "Vantage forum credential",
    token_hash: hashCredential(token),
    scopes: credentialScopes(kind),
    created_by: gate.actorId,
  });
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "mint_api_credential", "api_credential", gate.actorId);
  revalidateAdmin();
  return { ok: true, token };
}

export async function adminRevokeCredential(id: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin
    .from("api_credentials")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, "revoke_api_credential", "api_credential", id);
  revalidateAdmin();
  return { ok: true };
}

export async function adminResolveReport(reportId: string, status: "actioned" | "dismissed"): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  const { error } = await gate.auth.admin.from("content_reports").update({ status }).eq("id", reportId);
  if (error) return fail(error.message);
  await operatorAudit(gate.auth.admin, gate.actorId, `report_${status}`, "content_report", reportId);
  revalidateAdmin();
  return { ok: true };
}
