export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", description: "Queues and platform volume" },
  { href: "/admin/verifications", label: "Verifications", description: "File or review passport checks" },
  { href: "/admin/people", label: "People", description: "Add people, photos, flags and hide" },
  { href: "/admin/organisations", label: "Organisations", description: "Add brands, media, products and credentials" },
  { href: "/admin/projects", label: "Projects", description: "Add projects, covers and video" },
  { href: "/admin/opportunities", label: "Jobs & gigs", description: "Publish or close listings" },
  { href: "/admin/moderation", label: "Moderation", description: "Publish posts, hide rows, reports" },
  { href: "/admin/activity", label: "Activity", description: "First-party events from the last 7 days" },
  { href: "/admin/audit", label: "Audit", description: "What operators changed" },
  { href: "/admin/forums", label: "Forums", description: "Vantage thread mappings and AI source" },
  { href: "/admin/settings", label: "Settings", description: "Demo data, operators and credentials" },
] as const;
