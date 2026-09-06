const HANDLE_FORMAT = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export function suggestedHandle(name: string, fallback = "person") {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  if (HANDLE_FORMAT.test(base)) return base;
  if (/^[a-z0-9]{2}$/.test(base)) return `${base}x`;
  if (/^[a-z0-9]$/.test(base)) return `${base}id`;
  return fallback;
}

export function isValidHandle(value: string) {
  return HANDLE_FORMAT.test(value);
}

export function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function alreadyExists(message: string) {
  return /already|registered|exists/i.test(message);
}
