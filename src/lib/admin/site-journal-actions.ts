"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/actions/shared";
import { limitAction } from "@/lib/actions/notify";
import { requirePlatformAdminResult } from "@/lib/admin/access";
import { adminJournalPatchSchema, adminEntryPatchSchema } from "@/lib/domain/site-journal";
import { isUuid } from "@/lib/domain/messaging-rules";
import type { SiteJournalRow } from "@/lib/domain/site-journal";

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
  revalidatePath("/projects");
  revalidatePath("/journals");
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
