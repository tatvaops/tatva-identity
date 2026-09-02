export const product = {
  name: process.env.NEXT_PUBLIC_PRODUCT_NAME ?? "Tatva Identity",
  tagline:
    process.env.NEXT_PUBLIC_PRODUCT_TAGLINE ??
    "Verified professional identity for every kind of work",
  ecosystem: process.env.NEXT_PUBLIC_ECOSYSTEM_NAME ?? "Tatva",
} as const;

export const searchPlaceholder =
  "Search people, skills, jobs, companies or projects";
