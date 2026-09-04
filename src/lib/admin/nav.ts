export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", description: "Queues and platform volume" },
  { href: "/admin/verifications", label: "Verifications", description: "Passport checks waiting on a reviewer" },
  { href: "/admin/people", label: "People", description: "Flags, hide, credential state" },
  { href: "/admin/organisations", label: "Organisations", description: "Business passports and credentials" },
  { href: "/admin/projects", label: "Projects", description: "Mark opted-in projects verified" },
  { href: "/admin/opportunities", label: "Jobs & gigs", description: "Close listings that should not stay public" },
  { href: "/admin/moderation", label: "Moderation", description: "Posts, reports, hidden rows" },
  { href: "/admin/activity", label: "Activity", description: "First-party events from the last 7 days" },
  { href: "/admin/audit", label: "Audit", description: "What operators changed" },
  { href: "/admin/settings", label: "Settings", description: "Demo data and operators" },
] as const;
