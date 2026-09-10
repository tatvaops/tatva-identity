"use server";

import { revalidatePath } from "next/cache";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { limitAction } from "@/lib/actions/notify";
import { slugify } from "@/lib/domain/slug";
import {
  canAddEntry,
  canSubmitJournal,
  createFieldNoteSchema,
  createSiteJournalEntrySchema,
  createSiteJournalSchema,
} from "@/lib/domain/site-journal";
import { SITE_JOURNALS_PATH, siteJournalPath } from "@/lib/domain/site-journal-routes";
import { isUuid } from "@/lib/domain/messaging-rules";

function revalidateJournals(slug?: string) {
  revalidatePath(SITE_JOURNALS_PATH);
  revalidatePath("/admin/site-journals");
  if (slug) revalidatePath(siteJournalPath(slug));
}

export async function createSiteJournalAction(input: unknown): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId || !auth.ctx.profile) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`site-journal-create:${auth.ctx.userId}`, 8, 60_000);
  if (limited) return limited;
  const parsed = createSiteJournalSchema.safeParse(input);
  if (!parsed.success) return fail("Enter a title, start date and the project facts you have.");
  const start = parsed.data.timeline_start_date;
  if (Number.isNaN(Date.parse(start))) return fail("Enter a valid start date.");
  const slug = slugify(parsed.data.title, "journal");
  const inserted = await auth.supabase
    .from("site_journals")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      cover_media: parsed.data.cover_media || null,
      project_type: parsed.data.project_type || null,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      budget_range: parsed.data.budget_range || null,
      timeline_start_date: start.slice(0, 10),
      visibility: parsed.data.visibility ?? "public",
      owner_id: auth.ctx.userId,
      tags: parsed.data.tags ?? [],
      status: "draft",
    })
    .select("id, slug")
    .single();
  if (inserted.error || !inserted.data) return fail("Could not create that journal.");
  await auth.supabase.from("site_journal_contributors").insert({
    journal_id: inserted.data.id,
    profile_id: auth.ctx.userId,
    role: "owner",
    badge: "Owner",
  });
  revalidateJournals(inserted.data.slug);
  return { ok: true, id: inserted.data.slug };
}

export async function addSiteJournalEntryAction(slug: string, input: unknown): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`site-journal-entry:${auth.ctx.userId}`, 20, 60_000);
  if (limited) return limited;
  const parsed = createSiteJournalEntrySchema.safeParse(input);
  if (!parsed.success) return fail("Enter the week, type, title and what happened on site.");
  const journal = await auth.supabase.from("site_journals").select("id, slug, status, owner_id").eq("slug", slug).maybeSingle();
  if (!journal.data) return fail("That journal is not available.");
  if (!canAddEntry(journal.data.status)) return fail("This journal is archived.");
  const member = await auth.supabase
    .from("site_journal_contributors")
    .select("profile_id")
    .eq("journal_id", journal.data.id)
    .eq("profile_id", auth.ctx.userId)
    .maybeSingle();
  if (journal.data.owner_id !== auth.ctx.userId && !member.data) return fail("Only the owner or a contributor can add a weekly entry.");
  const loc = parsed.data.location_context;
  const inserted = await auth.supabase.from("site_journal_entries").insert({
    journal_id: journal.data.id,
    week_number: parsed.data.week_number,
    entry_type: parsed.data.entry_type,
    title: parsed.data.title,
    content: parsed.data.content,
    media: parsed.data.media ?? [],
    location_city: loc?.city ?? null,
    location_region: loc?.region ?? null,
    location_area: loc?.area ?? null,
    risk_level: parsed.data.risk_level ?? "low",
    tags: parsed.data.tags ?? [],
    ai_insight: parsed.data.ai_insight || null,
    related_discussion_ids: parsed.data.related_discussion_ids ?? [],
    created_by: auth.ctx.userId,
  });
  if (inserted.error) return fail("Could not save that weekly entry.");
  revalidateJournals(journal.data.slug);
  return { ok: true, id: journal.data.slug };
}

export async function submitSiteJournalAction(slug: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const journal = await auth.supabase.from("site_journals").select("id, slug, status, owner_id").eq("slug", slug).maybeSingle();
  if (!journal.data) return fail("That journal is not available.");
  if (journal.data.owner_id !== auth.ctx.userId) return fail("Only the owner can submit this journal for review.");
  if (!canSubmitJournal(journal.data.status)) return fail("This journal is already in review or published.");
  const updated = await auth.supabase.from("site_journals").update({ status: "pending_review" }).eq("id", journal.data.id).eq("owner_id", auth.ctx.userId);
  if (updated.error) return fail("Could not submit that journal.");
  revalidateJournals(journal.data.slug);
  return { ok: true, id: journal.data.slug };
}

export async function addFieldNoteAction(slug: string, entryId: string, input: unknown): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  const limited = await limitAction(`site-journal-note:${auth.ctx.userId}`, 30, 60_000);
  if (limited) return limited;
  if (!isUuid(entryId)) return fail("That entry is not available.");
  const parsed = createFieldNoteSchema.safeParse(input);
  if (!parsed.success) return fail("Write a field note before posting.");
  const entry = await auth.supabase.from("site_journal_entries").select("id, journal_id").eq("id", entryId).maybeSingle();
  if (!entry.data) return fail("That entry is not available.");
  const journal = await auth.supabase.from("site_journals").select("slug").eq("id", entry.data.journal_id).eq("slug", slug).maybeSingle();
  if (!journal.data) return fail("That journal is not available.");
  const parentId: string | null = parsed.data.parent_comment_id ?? null;
  if (parentId) {
    if (!isUuid(parentId)) return fail("That reply target is not available.");
    const parent = await auth.supabase
      .from("site_journal_field_notes")
      .select("id, parent_id, entry_id")
      .eq("id", parentId)
      .eq("entry_id", entryId)
      .maybeSingle();
    if (!parent.data || parent.data.parent_id) return fail("Replies are one level only.");
  }
  const inserted = await auth.supabase.from("site_journal_field_notes").insert({
    entry_id: entryId,
    parent_id: parentId,
    author_id: auth.ctx.userId,
    content: parsed.data.content,
  });
  if (inserted.error) return fail("Could not post that field note.");
  revalidateJournals(slug);
  return { ok: true, id: entryId };
}

export async function deleteFieldNoteAction(slug: string, entryId: string, commentId: string): Promise<ActionResult> {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId) return fail(auth.error ?? "Unavailable");
  if (!isUuid(entryId) || !isUuid(commentId)) return fail("That field note is not available.");
  const updated = await auth.supabase
    .from("site_journal_field_notes")
    .update({ deleted_at: new Date().toISOString(), content: "Removed" })
    .eq("id", commentId)
    .eq("entry_id", entryId)
    .eq("author_id", auth.ctx.userId)
    .is("deleted_at", null);
  if (updated.error) return fail("Could not remove that field note.");
  revalidateJournals(slug);
  return { ok: true };
}
