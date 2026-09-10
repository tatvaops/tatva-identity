import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NEW_SITE_JOURNAL_PATH, SITE_JOURNALS_PATH, siteJournalPath } from "./site-journal-routes";

describe("site journal routes", () => {
  it("keeps journal routes separate from verified projects", () => {
    assert.equal(SITE_JOURNALS_PATH, "/journals");
    assert.equal(NEW_SITE_JOURNAL_PATH, "/journals/new");
    assert.equal(siteJournalPath("weekly-build"), "/journals/weekly-build");
    assert.equal(siteJournalPath("Miyapur build"), "/journals/Miyapur%20build");
  });
});
