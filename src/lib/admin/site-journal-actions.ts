"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/actions/shared";
import { limitAction } from "@/lib/actions/notify";
import { requirePlatformAdminResult } from "@/lib/admin/access";
import {
  adminEntryPatchSchema,
  adminJournalPatchSchema,
  generateSiteJournalAiInsight,
  generateSiteJournalAiSummary,
  type SiteJournalRow,
  type SiteJournalEntryRow,
} from "@/lib/domain/site-journal";
import { isUuid } from "@/lib/domain/messaging-rules";
import { SITE_JOURNALS_PATH } from "@/lib/domain/site-journal-routes";
import { generateGroqJournalContent } from "@/lib/integrations/groq";

async function gated() {
  const limited = await limitAction("admin-write", 80, 60_000);
  if (limited) return { ok: false as const, result: limited };
  const gate = await requirePlatformAdminResult();
  if (!gate.ok) return gate;
  if (!gate.auth.ctx.userId || !gate.auth.admin) {
    return { ok: false as const, result: fail("This console is only for platform operators.") };
  }
  return { ok: true as const, auth: gate.auth, actorId: gate.auth.ctx.userId, admin: gate.auth.admin };
}

function revalidate() {
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/site-journals");
  revalidatePath(SITE_JOURNALS_PATH, "layout");
}

export async function listAdminSiteJournals(filters: { status?: string; q?: string } = {}) {
  const gate = await gated();
  if (!gate.ok) return [] as SiteJournalRow[];
  let query = gate.admin.from("site_journals").select("*").order("updated_at", { ascending: false }).limit(200);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const q = filters.q.replace(/[%*,()]/g, "").slice(0, 80);
    if (q) query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%`);
  }
  const { data } = await query;
  return (data ?? []) as SiteJournalRow[];
}

export async function adminPatchSiteJournal(id: string, input: unknown): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!isUuid(id)) return fail("That journal is not available.");
  const parsed = adminJournalPatchSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a valid status, health or moderation state.");
  const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));
  if (Object.keys(patch).length === 0) return fail("Nothing to update.");
  const updated = await gate.admin.from("site_journals").update(patch).eq("id", id);
  if (updated.error) return fail("Could not update that journal.");
  await gate.admin.from("audit_logs").insert({
    actor_id: gate.actorId,
    action: "patch_site_journal",
    entity_kind: "site_journal",
    entity_id: id,
  });
  revalidate();
  return { ok: true, id };
}

export async function adminPatchSiteJournalEntry(entryId: string, input: unknown): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!isUuid(entryId)) return fail("That entry is not available.");
  const parsed = adminEntryPatchSchema.safeParse(input);
  if (!parsed.success) return fail("Choose a valid moderation state, insight or risk level.");
  const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));
  if (Object.keys(patch).length === 0) return fail("Nothing to update.");
  const updated = await gate.admin.from("site_journal_entries").update(patch).eq("id", entryId);
  if (updated.error) return fail("Could not update that entry.");
  await gate.admin.from("audit_logs").insert({
    actor_id: gate.actorId,
    action: "patch_site_journal_entry",
    entity_kind: "site_journal_entry",
    entity_id: entryId,
  });
  revalidate();
  return { ok: true, id: entryId };
}

export async function adminPublishSiteJournalWithAi(id: string): Promise<ActionResult> {
  const gate = await gated();
  if (!gate.ok) return gate.result;
  if (!isUuid(id)) return fail("That journal is not available.");

  const journal = await gate.admin
    .from("site_journals")
    .select("id, slug, title, description, project_type, city, region, budget_range, health_status, status")
    .eq("id", id)
    .maybeSingle();
  if (journal.error || !journal.data) return fail("That journal is not available.");
  if (journal.data.status === "archived") return fail("Archived journals must be restored before publishing.");

  const entries = await gate.admin
    .from("site_journal_entries")
    .select(
      "id, journal_id, week_number, entry_type, title, content, media, location_city, location_region, location_area, risk_level, tags, ai_insight, related_discussion_ids, created_by, moderation_status, created_at",
    )
    .eq("journal_id", id)
    .order("week_number", { ascending: false })
    .limit(500);
  if (entries.error) return fail("Could not read the journal entries.");

  const journalRow = journal.data as Parameters<typeof generateSiteJournalAiSummary>[0];
  const entryRows = (entries.data ?? []) as SiteJournalEntryRow[];
  const summary = generateSiteJournalAiSummary(journalRow, entryRows);
  const groq = await generateGroqJournalContent(journalRow, entryRows);
  const finalSummary = groq?.summary ?? summary;
  for (const entry of entryRows.filter((row) => !row.ai_insight)) {
    const generatedInsight = groq?.insights.get(entry.id) ?? generateSiteJournalAiInsight(entry);
    const insight = await gate.admin
      .from("site_journal_entries")
      .update({ ai_insight: generatedInsight })
      .eq("id", entry.id)
      .is("ai_insight", null);
    if (insight.error) return fail("Could not complete the AI insights, so the journal was not published.");
  }

  const updated = await gate.admin
    .from("site_journals")
    .update({ status: "published", ai_summary: finalSummary })
    .eq("id", id);
  if (updated.error) return fail("Could not publish that journal.");

  await gate.admin.from("audit_logs").insert({
    actor_id: gate.actorId,
    action: "publish_site_journal_with_ai",
    entity_kind: "site_journal",
    entity_id: id,
  });
  revalidate();
  revalidatePath(`/journals/${journal.data.slug}`);
  return { ok: true, id };
}
