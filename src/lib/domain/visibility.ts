import type { PublicProfile, VisibilityAudience } from "@/lib/types/identity";

export type ViewerRelation = {
  isOwner: boolean;
  isConnected: boolean;
  isRecruiter: boolean;
};

export function audienceAllows(audience: VisibilityAudience | "none" | string | null | undefined, viewer: ViewerRelation) {
  if (viewer.isOwner) return true;
  const value = audience || "public";
  if (value === "public") return true;
  if (value === "connections") return viewer.isConnected;
  if (value === "recruiters") return viewer.isRecruiter || viewer.isConnected;
  return false;
}

export function applyProfilePrivacy(profile: PublicProfile, viewer: ViewerRelation): PublicProfile {
  const next = { ...profile };
  if (!audienceAllows(profile.aboutVisibleTo, viewer)) next.about = null;
  if (!audienceAllows(profile.locationVisibleTo, viewer)) {
    next.city = null;
    next.state = null;
    next.locality = null;
    next.preferredWorkLocations = [];
  }
  if (!audienceAllows(profile.availabilityVisibleTo, viewer)) {
    next.preferredRoles = [];
    next.preferredCities = [];
    next.availabilityStatus = "not_looking";
  }
  return next;
}

export function ownerViewer(): ViewerRelation {
  return { isOwner: true, isConnected: true, isRecruiter: true };
}

export function publicViewer(): ViewerRelation {
  return { isOwner: false, isConnected: false, isRecruiter: false };
}

export function viewerFromNetwork(options: {
  isOwner: boolean;
  connectionState?: "connect" | "pending" | "incoming" | "connected";
  isRecruiter?: boolean;
}): ViewerRelation {
  return {
    isOwner: options.isOwner,
    isConnected: options.connectionState === "connected",
    isRecruiter: Boolean(options.isRecruiter),
  };
}

export function showAvailability(profile: PublicProfile, viewer: ViewerRelation) {
  return audienceAllows(profile.availabilityVisibleTo, viewer);
}

export function showExperience(profile: PublicProfile, viewer: ViewerRelation) {
  return audienceAllows(profile.experienceVisibleTo, viewer);
}

export function showProjects(profile: PublicProfile, viewer: ViewerRelation) {
  return audienceAllows(profile.projectsVisibleTo, viewer);
}

export function showActivity(profile: PublicProfile, viewer: ViewerRelation) {
  return audienceAllows(profile.activityVisibleTo, viewer);
}

export function showConnections(profile: PublicProfile, viewer: ViewerRelation) {
  return audienceAllows(profile.connectionsVisibleTo, viewer);
}
