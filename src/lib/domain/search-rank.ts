import { isOpenToWork } from "@/lib/domain/availability";
import type { GigPost, JobPost, Organisation, PublicProfile } from "@/lib/types/identity";

function haystack(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function rankPeople(people: PublicProfile[], query: string) {
  const q = query.trim().toLowerCase();
  return [...people].sort((a, b) => scorePerson(b, q) - scorePerson(a, q));
}

function scorePerson(profile: PublicProfile, q: string) {
  let score = 0;
  if (profile.identityVerified) score += 6;
  if (profile.employmentVerified) score += 4;
  if (profile.tradeVerified) score += 3;
  if (isOpenToWork(profile.availabilityStatus)) score += 3;
  if (profile.availabilityStatus === "available_immediately") score += 1;
  if (!q) return score;
  const text = haystack(profile.fullName, profile.headline, profile.city, profile.locality, ...profile.preferredRoles);
  if (profile.fullName.toLowerCase().includes(q)) score += 5;
  if (profile.city?.toLowerCase().includes(q) || profile.locality?.toLowerCase().includes(q)) score += 3;
  if (text.includes(q)) score += 1;
  return score;
}

export function rankOrganisations(orgs: Organisation[], query: string) {
  const q = query.trim().toLowerCase();
  return [...orgs].sort((a, b) => scoreOrg(b, q) - scoreOrg(a, q));
}

function scoreOrg(org: Organisation, q: string) {
  let score = 0;
  if (org.foundedYear) score += 1;
  if (!q) return score;
  if (org.name.toLowerCase().includes(q)) score += 5;
  if (org.city?.toLowerCase().includes(q)) score += 3;
  if (haystack(org.tagline, org.industry, org.about).includes(q)) score += 1;
  return score;
}

export function rankJobs(jobs: JobPost[], query: string) {
  const q = query.trim().toLowerCase();
  return [...jobs].sort((a, b) => scoreJob(b, q) - scoreJob(a, q));
}

function scoreJob(job: JobPost, q: string) {
  let score = 0;
  if (job.easyApply) score += 1;
  if (!q) return score;
  if (job.title.toLowerCase().includes(q)) score += 5;
  if (job.city?.toLowerCase().includes(q)) score += 3;
  if (job.skills.some((skill) => skill.toLowerCase().includes(q))) score += 4;
  return score;
}

export function rankGigs(gigs: GigPost[], query: string) {
  const q = query.trim().toLowerCase();
  return [...gigs].sort((a, b) => scoreGig(b, q) - scoreGig(a, q));
}

function scoreGig(gig: GigPost, q: string) {
  let score = 0;
  if (gig.distanceKm != null) score += Math.max(0, 4 - Math.min(gig.distanceKm / 10, 4));
  if (!q) return score;
  if (gig.title.toLowerCase().includes(q)) score += 5;
  if (gig.trade?.toLowerCase().includes(q)) score += 4;
  if (gig.siteName?.toLowerCase().includes(q)) score += 3;
  return score;
}

export function sortGigsNearby(gigs: GigPost[]) {
  return [...gigs].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}
