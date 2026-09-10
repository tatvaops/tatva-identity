export const SITE_JOURNALS_PATH = "/journals";
export const NEW_SITE_JOURNAL_PATH = `${SITE_JOURNALS_PATH}/new`;

export function siteJournalPath(slug: string) {
  return `${SITE_JOURNALS_PATH}/${encodeURIComponent(slug)}`;
}
