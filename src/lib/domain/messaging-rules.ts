const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID.test(value));
}

export function canStartDirectConversation(actorId: string | null | undefined, otherId: string) {
  return Boolean(actorId) && isUuid(otherId) && actorId !== otherId;
}

export function canReadConversation(input: { userId: string | null | undefined; isMember: boolean }) {
  return Boolean(input.userId) && input.isMember;
}

export function canMessageApplicant(input: { userId: string | null | undefined; isOrgStaff: boolean; candidateId: string }) {
  return Boolean(input.userId) && input.isOrgStaff && isUuid(input.candidateId) && input.userId !== input.candidateId;
}
