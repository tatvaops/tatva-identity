export function adminSearchTerm(query: string) {
  return query
    .replace(/[^a-zA-Z0-9@_\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}
