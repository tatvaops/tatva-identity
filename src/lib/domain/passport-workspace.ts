export const PASSPORT_WORKSPACE_SECTIONS = [
  "identity",
  "employment",
  "skills",
  "projects",
  "credentials",
  "references",
  "availability",
  "documents",
] as const;

const SECTION_ALIASES: Record<string, string> = {
  overview: "identity",
  experience: "employment",
  certifications: "credentials",
  reputation: "references",
};

export function resolvePassportSection(section?: string | null) {
  const raw = section?.trim() || "identity";
  const mapped = SECTION_ALIASES[raw] ?? raw;
  return (PASSPORT_WORKSPACE_SECTIONS as readonly string[]).includes(mapped) ? mapped : "identity";
}

export function isPassportWorkspaceSection(value: string) {
  return (
    (PASSPORT_WORKSPACE_SECTIONS as readonly string[]).includes(value) ||
    Object.prototype.hasOwnProperty.call(SECTION_ALIASES, value)
  );
}
