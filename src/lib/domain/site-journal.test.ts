import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAddEntry,
  canSubmitJournal,
  createSiteJournalSchema,
  mapHealthToUi,
  progressPercent,
  sanitizeJournalSearchTerm,
  toSiteJournalProject,
  timelineStage,
  type SiteJournalEntryRow,
  type SiteJournalRow,
} from "./site-journal";

const journal: SiteJournalRow = {
  id: "j1",
  slug: "g-2-miyapur",
  title: "G+2 Residential Build",
  description: "Tracking procurement.",
  cover_media: "https://example.com/cover.jpg",
  project_type: "Residential Construction",
  city: "Hyderabad",
  region: "Telangana",
  budget_range: "₹1Cr – ₹5Cr",
  timeline_start_date: "2026-01-15",
  status: "published",
  health_status: "watch_procurement",
  owner_id: "owner-1",
  tags: ["steel"],
  visibility: "public",
  ai_summary: null,
  featured: false,
  moderation_status: "clean",
  created_at: "2026-02-01T00:00:00.000Z",
};

const entry: SiteJournalEntryRow = {
  id: "e1",
  journal_id: "j1",
  week_number: 14,
  entry_type: "Procurement Insight",
  title: "Steel supplier changed",
  content: "Primary vendor could not guarantee rolling dispatch.",
  media: [{ type: "image", url: "https://example.com/rebar.jpg", caption: "Rebar" }],
  location_city: "Hyderabad",
  location_region: "Telangana",
  location_area: null,
  risk_level: "medium",
  tags: ["steel"],
  ai_insight: "Supplier concentration reduced.",
  related_discussion_ids: ["forum-1"],
  created_by: "owner-1",
  moderation_status: "clean",
  created_at: "2026-04-01T00:00:00.000Z",
};

describe("site journal mapping", () => {
  it("maps health and derived progress from week number", () => {
    assert.equal(mapHealthToUi("watch_procurement"), "watch");
    assert.equal(mapHealthToUi("delay_risk"), "risk");
    assert.equal(progressPercent(14), 56);
    assert.equal(progressPercent(40), 100);
    assert.equal(timelineStage(14, "watch"), "Procurement watch");
  });

  it("builds the public project shape from live rows", () => {
    const project = toSiteJournalProject({
      journal,
      entries: [entry],
      noteCounts: { e1: 2 },
      people: { "owner-1": { name: "Tejas", badge: "Owner" } },
      viewerId: "owner-1",
    });
    assert.equal(project.health, "watch");
    assert.equal(project.timeline.week, 14);
    assert.equal(project.timeline.progressPercent, 56);
    assert.equal(project.activeDiscussionCount, 2);
    assert.equal(project.canEdit, true);
    assert.equal(project.procurementSignal, "Steel supplier changed");
    assert.equal(project.timelineEntries[0]?.media[0]?.url, "https://example.com/rebar.jpg");
  });

  it("rejects a short create payload and allows a valid one", () => {
    assert.equal(createSiteJournalSchema.safeParse({ title: "ab", timeline_start_date: "2026-01-15" }).success, false);
    assert.equal(
      createSiteJournalSchema.safeParse({
        title: "G+2 Residential Build - Miyapur",
        timeline_start_date: "2026-01-15",
        city: "Hyderabad",
      }).success,
      true,
    );
  });

  it("sanitizes journal search input for PostgREST filters", () => {
    assert.equal(sanitizeJournalSearchTerm("steel%,(delay). Hyderabad"), "steel delay Hyderabad");
    assert.equal(sanitizeJournalSearchTerm("x".repeat(100)).length, 80);
  });

  it("gates submit and entries by status", () => {
    assert.equal(canSubmitJournal("draft"), true);
    assert.equal(canSubmitJournal("published"), false);
    assert.equal(canAddEntry("archived"), false);
    assert.equal(canAddEntry("published"), true);
  });
});
