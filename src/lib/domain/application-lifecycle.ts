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

const TERMINAL: ReadonlySet<ApplicationStatus> = new Set(["accepted", "rejected", "withdrawn"]);

export function canOperatorTransition(from: string, to: string) {
  const current = normalizeApplicationStatus(from);
  const next = normalizeApplicationStatus(to);
  if (current === next) return true;
  if (TERMINAL.has(current)) return false;
  if (next === "withdrawn") return false;
  return true;
}

export function canApplicantWithdraw(status: string) {
  const current = normalizeApplicationStatus(status);
  return current === "submitted" || current === "reviewing" || current === "shortlisted" || current === "interview";
}

export function operatorApplicationStatuses(kind: "job" | "gig"): ApplicationStatus[] {
  void kind;
  return ["submitted", "reviewing", "shortlisted", "interview", "accepted", "rejected"];
}

export function canApplyToListing(input: { closedAt?: string | null; seats?: number | null; exists?: boolean }) {
  if (input.exists === false) return false;
  if (input.closedAt) return false;
  if (input.seats === 0) return false;
  return true;
}

export function applicantMaySetStatus(nextStatus: string) {
  return nextStatus === "withdrawn";
}
