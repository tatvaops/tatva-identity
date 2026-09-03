import type { AvailabilityStatus } from "@/lib/types/identity";

export const AVAILABILITY_COPY: Record<AvailabilityStatus, { label: string; hint: string }> = {
  not_looking: { label: "Not looking", hint: "Not currently seeking work" },
  open_to_opportunities: { label: "Open to opportunities", hint: "Open to relevant professional opportunities" },
  open_to_jobs: { label: "Open to jobs", hint: "Open to longer-term roles" },
  open_to_gigs: { label: "Open to gigs", hint: "Open to short or shift-based work" },
  available_immediately: { label: "Available immediately", hint: "Can start without a notice period" },
  engaged: { label: "Engaged", hint: "Currently on an assignment" },
  on_leave: { label: "On leave", hint: "Temporarily unavailable" },
};

export function isOpenToWork(status: AvailabilityStatus): boolean {
  return (
    status === "open_to_opportunities" ||
    status === "open_to_jobs" ||
    status === "open_to_gigs" ||
    status === "available_immediately"
  );
}

export function availabilityLabel(status: string): string {
  return AVAILABILITY_COPY[status as AvailabilityStatus]?.label ?? status.replaceAll("_", " ");
}
