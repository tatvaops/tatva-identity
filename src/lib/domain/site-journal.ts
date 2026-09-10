import { z } from "zod";

export const JOURNAL_STATUSES = ["draft", "pending_review", "published", "archived"] as const;
export type JournalStatus = (typeof JOURNAL_STATUSES)[number];

export const JOURNAL_HEALTH = ["stable", "watch_procurement", "delay_risk", "stabilized"] as const;
export type JournalHealth = (typeof JOURNAL_HEALTH)[number];

export const JOURNAL_VISIBILITY = ["public", "unlisted", "private"] as const;
export type JournalVisibility = (typeof JOURNAL_VISIBILITY)[number];

export const MODERATION_STATUSES = ["clean", "flagged", "restricted"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const ENTRY_TYPES = [
  "Execution Update",
  "Procurement Insight",
  "Labor Update",
  "Vendor Change",
  "Risk Alert",
  "Milestone",
  "Cost Change",
  "Material Delivery",
  "AI Observation",
  "Field Note",
] as const;
export type JournalEntryType = (typeof ENTRY_TYPES)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const HEALTH_UI = ["stable", "watch", "risk"] as const;
export type HealthUi = (typeof HEALTH_UI)[number];

export function mapHealthToUi(health: string): HealthUi {
  if (health === "watch_procurement") return "watch";
  if (health === "delay_risk") return "risk";
  return "stable";
}

export function progressPercent(week: number) {
  if (!Number.isFinite(week) || week < 1) return 0;
  return Math.min(100, Math.round(week * 4));
}

export function timelineStage(week: number, health: HealthUi) {
  if (health === "risk") return "Delay watch";
  if (health === "watch") return "Procurement watch";
  if (week >= 20) return "Finishes";
  if (week >= 8) return "Structure";
  return "Mobilisation";
}

export const journalMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().trim().min(1).max(2000),
  caption: z.string().trim().max(300).optional(),
});

export const createSiteJournalSchema = z.object({
  title: z.string().trim().min(3).max(300),
  description: z.string().trim().max(10000).optional().or(z.literal("")),
  cover_media: z.string().trim().max(2000).optional().or(z.literal("")),
  project_type: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  budget_range: z.string().trim().max(80).optional().or(z.literal("")),
  timeline_start_date: z.string().trim().min(8),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  visibility: z.enum(JOURNAL_VISIBILITY).optional(),
});

export const createSiteJournalEntrySchema = z.object({
  week_number: z.coerce.number().int().min(1).max(500),
  entry_type: z.enum(ENTRY_TYPES),
  title: z.string().trim().min(3).max(300),
  content: z.string().trim().min(3).max(20000),
  media: z.array(journalMediaSchema).max(12).optional(),
  location_context: z
    .object({
      city: z.string().trim().max(80).optional(),
      region: z.string().trim().max(80).optional(),
      area: z.string().trim().max(80).optional(),
    })
    .optional(),
  risk_level: z.enum(RISK_LEVELS).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  ai_insight: z.string().trim().max(4000).optional().or(z.literal("")),
  related_discussion_ids: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
});

export const createFieldNoteSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parent_comment_id: z.uuid().nullable().optional(),
  author_name: z.string().trim().max(120).optional(),
});

export function sanitizeJournalSearchTerm(query: string) {
  return query
    .replace(/[^a-zA-Z0-9@_\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export const adminJournalPatchSchema = z.object({
  status: z.enum(JOURNAL_STATUSES).optional(),
  featured: z.boolean().optional(),
  health_status: z.enum(JOURNAL_HEALTH).optional(),
  moderation_status: z.enum(MODERATION_STATUSES).optional(),
  ai_summary: z.string().trim().max(4000).optional(),
});

export const adminEntryPatchSchema = z.object({
  moderation_status: z.enum(MODERATION_STATUSES).optional(),
  ai_insight: z.string().trim().max(4000).optional(),
  risk_level: z.enum(RISK_LEVELS).optional(),
});

export type JournalMedia = z.infer<typeof journalMediaSchema>;

export type SiteJournalTimelineEntry = {
  id: string;
  weekNumber: number;
  entryType: string;
  title: string;
  content: string;
  media: JournalMedia[];
  locationContext: { city?: string; region?: string; area?: string };
  riskLevel: RiskLevel;
  tags: string[];
  aiInsight: string | null;
  relatedDiscussionIds: string[];
  createdBy: string;
  createdAt: string;
  fieldNoteCount: number;
};

export type SiteJournalProject = {
  id: string;
  slug: string;
  title: string;
  city: string;
  region: string;
  marketType: string;
  projectType: string;
  budgetRange: string;
  timeline: { started: string; week: number; progressPercent: number; stage: string };
  leadContributor: { name: string; identityKey: string; badge: string };
  contributors: Array<{ name: string; badge: string; identityKey: string }>;
  health: HealthUi;
  status: JournalStatus;
  visibility: JournalVisibility;
  featured: boolean;
  ownerId: string;
  aiRiskPulse: string;
  aiSummary: string;
  procurementSignal: string;
  executionStatus: string;
  weatherRisk: string;
  activeDiscussionCount: number;
  updatePreview: string;
  mediaCover: string;
  tags: string[];
  relatedExperts: string[];
  similarProjects: string[];
  recommendations: string[];
  timelineEntries: SiteJournalTimelineEntry[];
  canEdit: boolean;
};

export type SiteJournalRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_media: string | null;
  project_type: string | null;
  city: string | null;
  region: string | null;
  budget_range: string | null;
  timeline_start_date: string;
  status: JournalStatus;
  health_status: JournalHealth;
  owner_id: string;
  tags: string[] | null;
  visibility: JournalVisibility;
  ai_summary: string | null;
  featured: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at?: string;
};

export type SiteJournalEntryRow = {
  id: string;
  journal_id: string;
  week_number: number;
  entry_type: string;
  title: string;
  content: string;
  media: unknown;
  location_city: string | null;
  location_region: string | null;
  location_area: string | null;
  risk_level: RiskLevel;
  tags: string[] | null;
  ai_insight: string | null;
  related_discussion_ids: string[] | null;
  created_by: string;
  moderation_status: ModerationStatus;
  created_at: string;
};

export type FieldNoteView = {
  id: string;
  author_name: string;
  content: string;
  identity_key: string;
  created_at: string;
  deleted: boolean;
  replies: FieldNoteView[];
};

function asMedia(value: unknown): JournalMedia[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = journalMediaSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export function toTimelineEntry(row: SiteJournalEntryRow, fieldNoteCount = 0): SiteJournalTimelineEntry {
  return {
    id: row.id,
    weekNumber: row.week_number,
    entryType: row.entry_type,
    title: row.title,
    content: row.content,
    media: asMedia(row.media),
    locationContext: {
      city: row.location_city ?? undefined,
      region: row.location_region ?? undefined,
      area: row.location_area ?? undefined,
    },
    riskLevel: row.risk_level,
    tags: row.tags ?? [],
    aiInsight: row.ai_insight,
    relatedDiscussionIds: row.related_discussion_ids ?? [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    fieldNoteCount,
  };
}

export function toSiteJournalProject(input: {
  journal: SiteJournalRow;
  entries: SiteJournalEntryRow[];
  noteCounts: Record<string, number>;
  people: Record<string, { name: string; badge?: string | null }>;
  viewerId?: string | null;
  similarSlugs?: string[];
}): SiteJournalProject {
  const { journal, entries, noteCounts, people, viewerId, similarSlugs = [] } = input;
  const timelineEntries = [...entries]
    .sort((a, b) => b.week_number - a.week_number || b.created_at.localeCompare(a.created_at))
    .map((row) => toTimelineEntry(row, noteCounts[row.id] ?? 0));
  const latestWeek = timelineEntries[0]?.weekNumber ?? 1;
  const health = mapHealthToUi(journal.health_status);
  const owner = people[journal.owner_id];
  const procurement = timelineEntries.find((entry) => /procurement|vendor|material/i.test(entry.entryType));
  const execution = timelineEntries.find((entry) => /execution|milestone|labor/i.test(entry.entryType));
  const highRisk = timelineEntries.find((entry) => entry.riskLevel === "high");
  const contributorIds = new Set<string>([journal.owner_id, ...entries.map((row) => row.created_by)]);
  return {
    id: journal.id,
    slug: journal.slug,
    title: journal.title,
    city: journal.city ?? "",
    region: journal.region ?? "",
    marketType: journal.project_type ?? "Construction",
    projectType: journal.project_type ?? "",
    budgetRange: journal.budget_range ?? "",
    timeline: {
      started: journal.timeline_start_date,
      week: latestWeek,
      progressPercent: progressPercent(latestWeek),
      stage: timelineStage(latestWeek, health),
    },
    leadContributor: {
      name: owner?.name ?? "Journal owner",
      identityKey: journal.owner_id,
      badge: owner?.badge ?? "Owner",
    },
    contributors: [...contributorIds].map((id) => ({
      name: people[id]?.name ?? "Contributor",
      badge: people[id]?.badge ?? (id === journal.owner_id ? "Owner" : "Contributor"),
      identityKey: id,
    })),
    health,
    status: journal.status,
    visibility: journal.visibility,
    featured: journal.featured,
    ownerId: journal.owner_id,
    aiRiskPulse: highRisk?.aiInsight || journal.ai_summary || (health === "risk" ? "Delay risk on the latest field update." : "Stable on current evidence."),
    aiSummary: journal.ai_summary || journal.description || "",
    procurementSignal: procurement?.title || "No procurement update yet.",
    executionStatus: execution?.title || timelineEntries[0]?.title || "No weekly entry yet.",
    weatherRisk: timelineEntries.some((entry) => entry.tags.some((tag) => /weather|rain|monsoon/i.test(tag)))
      ? "Weather tagged on a recent entry."
      : "No weather tag on recent entries.",
    activeDiscussionCount: Object.values(noteCounts).reduce((sum, count) => sum + count, 0),
    updatePreview: timelineEntries[0]?.content.slice(0, 180) || journal.description?.slice(0, 180) || "",
    mediaCover: journal.cover_media ?? "",
    tags: journal.tags ?? [],
    relatedExperts: [],
    similarProjects: similarSlugs,
    recommendations: similarSlugs.slice(0, 3).map((slug) => `/journals/${encodeURIComponent(slug)}`),
    timelineEntries,
    canEdit: Boolean(viewerId && (viewerId === journal.owner_id || contributorIds.has(viewerId))),
  };
}

export function canSubmitJournal(status: JournalStatus) {
  return status === "draft";
}

export function canAddEntry(status: JournalStatus) {
  return status === "draft" || status === "pending_review" || status === "published";
}
