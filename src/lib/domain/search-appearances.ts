export function shouldRecordSearchAppearance(input: {
  searcherId: string | null | undefined;
  profileId: string;
  query: string;
}) {
  if (!input.searcherId) return false;
  if (input.searcherId === input.profileId) return false;
  return input.query.trim().length >= 2;
}

export function searchAppearanceProfileIds(profileIds: string[], searcherId: string | null | undefined, query: string) {
  if (!shouldRecordSearchAppearance({ searcherId, profileId: "x", query })) return [];
  return [...new Set(profileIds.filter((id) => id && id !== searcherId))].slice(0, 12);
}
