import { createServerSupabase } from "@/lib/supabase/server";
import {
  emptyMeta,
  getAuthContext,
  itemOk,
  listOk,
  unconfiguredItem,
  unconfiguredList,
  type ItemResult,
  type ListResult,
} from "@/lib/data/query";
import { publicErrorMessage } from "@/lib/public-error";
import {
  mapHealthToUi,
  sanitizeJournalSearchTerm,
  toSiteJournalProject,
  type FieldNoteView,
  type SiteJournalEntryRow,
  type SiteJournalProject,
  type SiteJournalRow,
} from "@/lib/domain/site-journal";

export type JournalListFilters = {
  q?: string;
  city?: string;
  projectType?: string;
  risk?: "stable" | "watch" | "risk" | "all";
  includeUnpublished?: boolean;
  ownerId?: string;
};

const SITE_JOURNAL_COLUMNS =
  "id, slug, title, description, cover_media, project_type, city, region, budget_range, timeline_start_date, status, health_status, owner_id, tags, visibility, ai_summary, featured, moderation_status, created_at, updated_at";
const SITE_JOURNAL_ENTRY_COLUMNS =
  "id, journal_id, week_number, entry_type, title, content, media, location_city, location_region, location_area, risk_level, tags, ai_insight, related_discussion_ids, created_by, moderation_status, created_at";
const FIELD_NOTE_COLUMNS = "id, entry_id, parent_id, author_id, content, deleted_at, created_at";

function asJournal(row: Record<string, unknown>): SiteJournalRow {
  return row as unknown as SiteJournalRow;
}

function asEntry(row: Record<string, unknown>): SiteJournalEntryRow {
  return row as unknown as SiteJournalEntryRow;
}

function withoutParentId(note: {
  id: string;
  author_name: string;
  content: string;
  identity_key: string;
  created_at: string;
  deleted: boolean;
  parent_id: string | null;
}) {
  return {
    id: note.id,
    author_name: note.author_name,
    content: note.content,
    identity_key: note.identity_key,
    created_at: note.created_at,
    deleted: note.deleted,
    replies: [] as FieldNoteView[],
  };
}

async function peopleByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {} as Record<string, { name: string; badge?: string | null }>;
  const supabase = await createServerSupabase();
  if (!supabase) return {};
  const { data } = await supabase.from("public_profiles").select("id, full_name").in("id", unique);
  const map: Record<string, { name: string; badge?: string | null }> = {};
  for (const row of data ?? []) {
    map[row.id] = { name: row.full_name };
  }
  return map;
}

async function noteCountsForEntries(entryIds: string[]) {
  const counts: Record<string, number> = {};
  if (entryIds.length === 0) return { counts, error: null as string | null };
  const supabase = await createServerSupabase();
  if (!supabase) return { counts, error: null as string | null };
  const { data, error } = await supabase
    .from("site_journal_field_notes")
    .select("entry_id")
    .in("entry_id", entryIds)
    .is("deleted_at", null)
    .is("parent_id", null);
  if (error) return { counts, error: publicErrorMessage(error.message) };
  for (const row of data ?? []) {
    counts[row.entry_id] = (counts[row.entry_id] ?? 0) + 1;
  }
  return { counts, error: null as string | null };
}

async function loadEntries(journalIds: string[]) {
  if (journalIds.length === 0) return { entries: [] as SiteJournalEntryRow[], error: null as string | null };
  const supabase = await createServerSupabase();
  if (!supabase) return { entries: [], error: null as string | null };
  const { data, error } = await supabase
    .from("site_journal_entries")
    .select(SITE_JOURNAL_ENTRY_COLUMNS)
    .in("journal_id", journalIds)
    .order("week_number", { ascending: false })
    .limit(500);
  if (error) return { entries: [], error: publicErrorMessage(error.message) };
  return { entries: (data ?? []).map((row) => asEntry(row as Record<string, unknown>)), error: null as string | null };
}

function matchesRisk(journal: SiteJournalRow, risk?: JournalListFilters["risk"]) {
  if (!risk || risk === "all") return true;
  return mapHealthToUi(journal.health_status) === risk;
}

export async function listSiteJournals(filters: JournalListFilters = {}): Promise<ListResult<SiteJournalProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const session = await getAuthContext();
  let query = supabase.from("site_journals").select(SITE_JOURNAL_COLUMNS).order("updated_at", { ascending: false }).limit(80);
  if (!filters.includeUnpublished) {
    query = query.eq("status", "published").eq("visibility", "public");
  } else if (filters.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  } else if (session.userId) {
    query = query.eq("owner_id", session.userId);
  } else {
    query = query.eq("status", "published").eq("visibility", "public");
  }
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.projectType) query = query.eq("project_type", filters.projectType);
  if (filters.q) {
    const q = sanitizeJournalSearchTerm(filters.q);
    if (q) query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) return { data: [], meta: emptyMeta(publicErrorMessage(error.message)) };
  const journals = (data ?? []).map((row) => asJournal(row as Record<string, unknown>)).filter((row) => matchesRisk(row, filters.risk));
  const entriesResult = await loadEntries(journals.map((row) => row.id));
  if (entriesResult.error) return { data: [], meta: emptyMeta(entriesResult.error) };
  const notesResult = await noteCountsForEntries(entriesResult.entries.map((row) => row.id));
  if (notesResult.error) return { data: [], meta: emptyMeta(notesResult.error) };
  const entries = entriesResult.entries;
  const notes = notesResult.counts;
  const people = await peopleByIds([
    ...journals.map((row) => row.owner_id),
    ...entries.map((row) => row.created_by),
  ]);
  return listOk(
    journals.map((journal) =>
      toSiteJournalProject({
        journal,
        entries: entries.filter((entry) => entry.journal_id === journal.id),
        noteCounts: notes,
        people,
        viewerId: session.userId,
      }),
    ),
  );
}

export async function getSiteJournalBySlug(slug: string, includeUnpublished = false): Promise<ItemResult<SiteJournalProject>> {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredItem();
  const session = await getAuthContext();
  const { data, error } = await supabase.from("site_journals").select(SITE_JOURNAL_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) return { data: null, meta: emptyMeta(publicErrorMessage(error.message)) };
  if (!data) return itemOk<SiteJournalProject>(null);
  const journal = asJournal(data as Record<string, unknown>);
  if (!includeUnpublished && journal.status !== "published" && journal.owner_id !== session.userId) {
    return itemOk<SiteJournalProject>(null);
  }
  const entriesResult = await loadEntries([journal.id]);
  if (entriesResult.error) return { data: null, meta: emptyMeta(entriesResult.error) };
  const notesResult = await noteCountsForEntries(entriesResult.entries.map((row) => row.id));
  if (notesResult.error) return { data: null, meta: emptyMeta(notesResult.error) };
  const entries = entriesResult.entries;
  const notes = notesResult.counts;
  const people = await peopleByIds([journal.owner_id, ...entries.map((row) => row.created_by)]);
  const similar = await listRelatedSiteJournals({ city: journal.city, projectType: journal.project_type, excludeId: journal.id });
  return itemOk(
    toSiteJournalProject({
      journal,
      entries,
      noteCounts: notes,
      people,
      viewerId: session.userId,
      similarSlugs: similar.map((row) => row.slug),
    }),
  );
}

export async function listRelatedSiteJournals(input: {
  city?: string | null;
  projectType?: string | null;
  tags?: string[];
  excludeId?: string;
}): Promise<SiteJournalRow[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  let query = supabase.from("site_journals").select("id, slug, title, city, project_type, tags, status, visibility").eq("status", "published").eq("visibility", "public").limit(8);
  if (input.city) query = query.eq("city", input.city);
  const { data } = await query;
  return (data ?? [])
    .map((row) => asJournal(row as Record<string, unknown>))
    .filter((row) => row.id !== input.excludeId)
    .slice(0, 4);
}

export async function getSiteJournalFacets() {
  const listed = await listSiteJournals();
  const cities = [...new Set(listed.data.map((row) => row.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const types = [...new Set(listed.data.map((row) => row.projectType).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return { cities, types, meta: listed.meta };
}

export async function getProjectsMarketPulse() {
  const listed = await listSiteJournals();
  const watch = listed.data.filter((row) => row.health === "watch").length;
  const risk = listed.data.filter((row) => row.health === "risk").length;
  return {
    published: listed.data.length,
    watch,
    risk,
    cities: new Set(listed.data.map((row) => row.city).filter(Boolean)).size,
    meta: listed.meta,
  };
}

export async function getSiteJournalDirectory(filters: JournalListFilters = {}) {
  const [filtered, all] = await Promise.all([listSiteJournals(filters), listSiteJournals()]);
  const cities = [...new Set(all.data.map((row) => row.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const types = [...new Set(all.data.map((row) => row.projectType).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    journals: filtered,
    facets: { cities, types },
    pulse: {
      published: all.data.length,
      watch: all.data.filter((row) => row.health === "watch").length,
      risk: all.data.filter((row) => row.health === "risk").length,
      cities: new Set(all.data.map((row) => row.city).filter(Boolean)).size,
    },
    meta: filtered.meta.error ? filtered.meta : all.meta,
  };
}

export async function listFieldNotes(entryId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return unconfiguredList();
  const { data, error } = await supabase
    .from("site_journal_field_notes")
    .select(FIELD_NOTE_COLUMNS)
    .eq("entry_id", entryId)
    .order("created_at");
  if (error) return { data: [], meta: emptyMeta(publicErrorMessage(error.message)) };
  const people = await peopleByIds((data ?? []).map((row) => row.author_id));
  const notes = (data ?? []).map((row) => ({
    id: row.id,
    author_name: row.deleted_at ? "Removed" : people[row.author_id]?.name ?? "Member",
    content: row.deleted_at ? "This field note was removed." : row.content,
    identity_key: row.author_id,
    created_at: row.created_at,
    deleted: Boolean(row.deleted_at),
    parent_id: row.parent_id as string | null,
  }));
  const roots = notes.filter((note) => !note.parent_id).map((note) => ({
    ...withoutParentId(note),
    replies: notes.filter((child) => child.parent_id === note.id).map(withoutParentId),
  }));
  return listOk(roots);
}

export async function listFieldNotesByEntries(entryIds: string[]) {
  const grouped: Record<string, FieldNoteView[]> = {};
  for (const id of entryIds) grouped[id] = [];
  if (entryIds.length === 0) return grouped;
  const supabase = await createServerSupabase();
  if (!supabase) return grouped;
  const { data } = await supabase
    .from("site_journal_field_notes")
    .select(FIELD_NOTE_COLUMNS)
    .in("entry_id", entryIds)
    .order("created_at");
  const people = await peopleByIds((data ?? []).map((row) => row.author_id));
  const notes = (data ?? []).map((row) => ({
    id: row.id,
    entryId: row.entry_id as string,
    author_name: row.deleted_at ? "Removed" : people[row.author_id]?.name ?? "Member",
    content: row.deleted_at ? "This field note was removed." : row.content,
    identity_key: row.author_id,
    created_at: row.created_at,
    deleted: Boolean(row.deleted_at),
    parent_id: row.parent_id as string | null,
  }));
  for (const note of notes.filter((row) => !row.parent_id)) {
    grouped[note.entryId] = grouped[note.entryId] ?? [];
    grouped[note.entryId].push({
      id: note.id,
      author_name: note.author_name,
      content: note.content,
      identity_key: note.identity_key,
      created_at: note.created_at,
      deleted: note.deleted,
      replies: notes
        .filter((child) => child.parent_id === note.id)
        .map((child) => ({
          id: child.id,
          author_name: child.author_name,
          content: child.content,
          identity_key: child.identity_key,
          created_at: child.created_at,
          deleted: child.deleted,
          replies: [],
        })),
    });
  }
  return grouped;
}
