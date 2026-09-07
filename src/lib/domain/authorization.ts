const ORG_STAFF_ROLES = new Set(["owner", "admin", "recruiter"]);

export function canMutateOwnedResource(actorId: string | null | undefined, ownerId: string) {
  return Boolean(actorId) && actorId === ownerId;
}

export function canActForOrganisation(
  actorId: string | null | undefined,
  membership: { profileId: string; role: string; status: string } | null | undefined,
) {
  return Boolean(
    actorId &&
      membership &&
      membership.profileId === actorId &&
      membership.status === "active" &&
      ORG_STAFF_ROLES.has(membership.role),
  );
}

export function canViewApplication(input: {
  userId: string | null | undefined;
  isApplicant: boolean;
  isOrgStaff: boolean;
}) {
  return Boolean(input.userId) && (input.isApplicant || input.isOrgStaff);
}

export function canAccessAdminConsole(isPlatformAdmin: boolean) {
  return isPlatformAdmin;
}

export function canConnectTo(actorId: string | null | undefined, addresseeId: string) {
  return Boolean(actorId) && actorId !== addresseeId;
}
