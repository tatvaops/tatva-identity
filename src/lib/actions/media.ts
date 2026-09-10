"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const PRIVATE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function formValue(formData: FormData, name: string, fallback = "") {
  const value = formData.get(name);
  return typeof value === "string" ? value : fallback;
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "application/pdf") return "pdf";
  if (type === "video/webm") return "webm";
  if (type === "video/mp4") return "mp4";
  return "jpg";
}

async function organisationIdIfStaff(supabase: SupabaseClient, slug: string, userId: string) {
  const org = await supabase.from("organisations").select("id, created_by").eq("slug", slug).maybeSingle();
  if (!org.data) return null;
  if (org.data.created_by === userId) return org.data.id as string;
  const staff = await supabase.rpc("is_org_staff", { org_id: org.data.id });
  return staff.data ? (org.data.id as string) : null;
}

export async function uploadPublicImage(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const file = formData.get("file");
  const kind = formValue(formData, "kind", "avatar");
  const video = kind === "video" || VIDEO_TYPES.has(file instanceof File ? file.type : "");
  if (!(file instanceof File) || file.size === 0) return fail(video ? "Choose a video first." : "Choose an image first.");
  if (video) {
    if (file.size > 50 * 1024 * 1024) return fail("Keep videos under 50 MB.");
    if (!VIDEO_TYPES.has(file.type)) return fail("Use an MP4 or WebM video.");
  } else {
    if (file.size > 5 * 1024 * 1024) return fail("Keep images under 5 MB.");
    if (!PUBLIC_TYPES.has(file.type)) return fail("Use a JPEG, PNG or WebP image.");
  }
  let organisationId: string | null = null;
  if (!video && (kind === "org-logo" || kind === "org-cover")) {
    const slug = formValue(formData, "slug").trim();
    if (!slug) return fail("Choose the organisation first.");
    organisationId = await organisationIdIfStaff(auth.supabase, slug, auth.ctx.userId);
    if (!organisationId) return fail("You cannot update this organisation.");
  }
  const path = `${auth.ctx.userId}/${kind}-${Date.now()}.${extensionFor(file.type)}`;
  const uploaded = await auth.supabase.storage.from("identity-public").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploaded.error) return fail(uploaded.error.message);
  if (!video && kind === "avatar") {
    const updated = await auth.supabase.from("profiles").update({ avatar_path: path }).eq("id", auth.ctx.userId);
    if (updated.error) {
      await auth.supabase.storage.from("identity-public").remove([path]);
      return fail("The image uploaded, but the profile could not be updated.");
    }
  }
  if (!video && kind === "cover") {
    const updated = await auth.supabase.from("profiles").update({ cover_path: path }).eq("id", auth.ctx.userId);
    if (updated.error) {
      await auth.supabase.storage.from("identity-public").remove([path]);
      return fail("The image uploaded, but the profile could not be updated.");
    }
  }
  if (!video && (kind === "org-logo" || kind === "org-cover")) {
    const updated = await auth.supabase
      .from("organisations")
      .update(kind === "org-logo" ? { logo_path: path } : { cover_path: path })
      .eq("id", organisationId);
    if (updated.error) {
      await auth.supabase.storage.from("identity-public").remove([path]);
      return fail("The image uploaded, but the organisation could not be updated.");
    }
  }
  revalidatePath("/people");
  revalidatePath("/professionals");
  revalidatePath("/gig-workers");
  revalidatePath("/passport");
  revalidatePath("/companies");
  return { ok: true, id: path };
}

export async function uploadPrivateDocument(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const file = formData.get("file");
  const label = formValue(formData, "label", "Document").trim() || "Document";
  if (!(file instanceof File) || file.size === 0) return fail("Choose a file first.");
  if (file.size > 10 * 1024 * 1024) return fail("Keep files under 10 MB.");
  if (!PRIVATE_TYPES.has(file.type)) return fail("Use a JPEG, PNG, WebP or PDF.");
  const path = `${auth.ctx.userId}/documents/${Date.now()}.${extensionFor(file.type)}`;
  const uploaded = await auth.supabase.storage.from("identity-private").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploaded.error) return fail(uploaded.error.message);
  const { error } = await auth.supabase.from("profile_documents").insert({
    profile_id: auth.ctx.userId,
    label,
    storage_path: path,
  });
  if (error) {
    await auth.supabase.storage.from("identity-private").remove([path]);
    return fail("The document uploaded, but it could not be registered.");
  }
  revalidatePath("/passport");
  revalidatePath("/passport/documents");
  return { ok: true };
}

export async function createPrivateDocumentUrl(documentId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const document = await auth.supabase
    .from("profile_documents")
    .select("id, storage_path, profile_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!document.data || document.data.profile_id !== auth.ctx.userId) return fail("Document not found.");
  const signed = await auth.supabase.storage.from("identity-private").createSignedUrl(document.data.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) return fail("Could not open that document.");
  return { ok: true, id: signed.data.signedUrl };
}

export async function deletePrivateDocument(documentId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const document = await auth.supabase
    .from("profile_documents")
    .select("id, storage_path, profile_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!document.data || document.data.profile_id !== auth.ctx.userId) return fail("Document not found.");
  const removed = await auth.supabase.storage.from("identity-private").remove([document.data.storage_path]);
  if (removed.error) return fail("Could not remove that document.");
  const { error } = await auth.supabase.from("profile_documents").delete().eq("id", documentId).eq("profile_id", auth.ctx.userId);
  if (error) return fail(error.message);
  revalidatePath("/passport");
  revalidatePath("/passport/documents");
  return { ok: true };
}
