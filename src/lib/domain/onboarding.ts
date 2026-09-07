import { isValidHandle, suggestedHandle } from "@/lib/admin/create-helpers";
import { personPublicHref } from "@/lib/domain/identiti-routes";
import type { OccupationMode, PublicProfile } from "@/lib/types/identity";

export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "applications",
  "auth",
  "companies",
  "connections",
  "documents",
  "feed",
  "followers",
  "forum",
  "forums",
  "gig-workers",
  "gigs",
  "graph",
  "insights",
  "jobs",
  "messages",
  "network",
  "notifications",
  "onboarding",
  "org",
  "passport",
  "people",
  "product-brands",
  "professionals",
  "profile",
  "projects",
  "saved",
  "search",
  "service-brands",
  "services",
  "settings",
  "skills",
  "tatva",
  "identiti",
  "identity",
]);

export function normalizeHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

export function handleIsReserved(handle: string) {
  return RESERVED_HANDLES.has(handle);
}

export function handleIsGenerated(handle: string) {
  return handle.startsWith("u-");
}

export function profileNeedsIdentitySetup(profile: Pick<PublicProfile, "handle" | "fullName"> | null) {
  if (!profile) return true;
  const unnamed = !profile.fullName.trim() || profile.fullName === "New professional";
  return unnamed;
}

export function profileNeedsPublicHandle(profile: Pick<PublicProfile, "handle"> | null) {
  return !profile || handleIsGenerated(profile.handle);
}

export const ONBOARDING_STEPS = [
  { id: "identity", label: "Identity", required: true },
  { id: "type", label: "Type", required: true },
  { id: "handle", label: "Handle", required: false },
  { id: "headline", label: "Headline", required: false },
  { id: "category", label: "Category", required: false },
  { id: "skills", label: "Skills", required: false },
  { id: "services", label: "Services", required: false },
  { id: "location", label: "Location", required: false },
  { id: "photo", label: "Photograph", required: false },
  { id: "experience", label: "Experience", required: false },
  { id: "project", label: "Project", required: false },
  { id: "evidence", label: "Evidence", required: false },
  { id: "availability", label: "Availability", required: false },
  { id: "review", label: "Review", required: false },
  { id: "publish", label: "Publish", required: true },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];
export type OnboardingAccountKind = "individual" | "organisation";

export function clampOnboardingStep(step: number) {
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(ONBOARDING_STEPS.length - 1, Math.floor(step));
}

export function onboardingStepIndex(id: OnboardingStepId) {
  return ONBOARDING_STEPS.findIndex((step) => step.id === id);
}

export function occupationFromTitle(title?: string | null): OccupationMode {
  if (title === "blue_collar" || title === "skilled_trade" || title === "gig_worker") return "blue_collar";
  if (title === "contractor") return "contractor";
  if (title === "freelancer") return "freelancer";
  return "white_collar";
}

export function defaultHandleFromName(name: string) {
  return suggestedHandle(name, "person");
}

export { isValidHandle, personPublicHref };
