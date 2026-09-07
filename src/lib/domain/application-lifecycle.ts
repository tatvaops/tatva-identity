export const APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const LEGACY: Record<string, ApplicationStatus> = {
  hired: "accepted",
  pending: "submitted",
  selected: "accepted",
  reviewed: "reviewing",
};

const LABELS: Record<ApplicationStatus, string> = {
  submitted: "Applied",
  reviewing: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  accepted: "Selected",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function normalizeApplicationStatus(status: string): ApplicationStatus {
  if ((APPLICATION_STATUSES as readonly string[]).includes(status)) return status as ApplicationStatus;
  return LEGACY[status] ?? "submitted";
}

export function applicationStatusLabel(status: string) {
  return LABELS[normalizeApplicationStatus(status)];
}

export function operatorApplicationStatuses(_kind: "job" | "gig"): ApplicationStatus[] {
  return ["submitted", "reviewing", "shortlisted", "interview", "accepted", "rejected"];
}
