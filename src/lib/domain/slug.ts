export function slugify(value: string, fallback = "item") {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || fallback}-${crypto.randomUUID().slice(0, 8)}`;
}
