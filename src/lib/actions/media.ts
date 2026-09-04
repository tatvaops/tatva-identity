"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";

const PUBLIC_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const PRIVATE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "application/pdf") return "pdf";
  return "jpg";
}

export async function uploadPublicImage(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "avatar");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image first.");
  if (file.size > 5 * 1024 * 1024) return fail("Keep images under 5 MB.");
  if (!PUBLIC_TYPES.has(file.type)) return fail("Use a JPEG, PNG or WebP image.");
  const path = `${auth.ctx.userId}/${kind}-${Date.now()}.${extensionFor(file.type)}`;
  const uploaded = await auth.supabase.storage.from("identity-public").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploaded.error) return fail(uploaded.error.message);
  if (kind === "avatar") {
    await auth.supabase.from("profiles").update({ avatar_path: path }).eq("id", auth.ctx.userId);
  }
  if (kind === "cover") {
    await auth.supabase.from("profiles").update({ cover_path: path }).eq("id", auth.ctx.userId);
  }
  if (kind === "org-logo" || kind === "org-cover") {
    const slug = String(formData.get("slug") ?? "");
    if (slug) {
      await auth.supabase
        .from("organisations")
        .update(kind === "org-logo" ? { logo_path: path } : { cover_path: path })
        .eq("slug", slug)
        .eq("created_by", auth.ctx.userId);
    }
  }
  revalidatePath("/people");
  revalidatePath("/companies");
  return { ok: true, id: path };
}

export async function uploadPrivateDocument(formData: FormData): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "Document").trim() || "Document";
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
  if (error) return fail(error.message);
  revalidatePath("/passport");
  revalidatePath("/passport/documents");
  return { ok: true };
}
