"use client";

import {
  Award,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AVAILABILITY_COPY } from "@/lib/domain/availability";
import type { AvailabilityStatus } from "@/lib/types/identity";
import type { VerificationFlag } from "@/lib/domain/verification";
import { cn } from "@/lib/utils";

const icons = {
  identity: ShieldCheck,
  employment: Building2,
  trade: BadgeCheck,
  project: ClipboardCheck,
  skill: BadgeCheck,
  credential: Award,
  tatva: Shield,
};

export function VerificationBadge({
  flag,
  compact = false,
}: {
  flag: VerificationFlag;
  compact?: boolean;
}) {
  const Icon = icons[flag.kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
            flag.state !== "verified" && "opacity-70",
            "bg-[#ecf8f3] text-verify",
          )}
        >
          <Icon className="size-3" aria-hidden />
          {!compact && flag.label}
          <span className="sr-only">{flag.explanation}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{flag.label}</p>
        <p className="mt-1 text-white/80">{flag.explanation}</p>
        {flag.verifiedBy ? <p className="mt-1">Verified by {flag.verifiedBy}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}

export function VerificationTooltip({ flag }: { flag: VerificationFlag }) {
  return <VerificationBadge flag={flag} />;
}

export function AvailabilityBadge({
  status,
  labeled = false,
}: {
  status: string;
  labeled?: boolean;
}) {
  const copy = AVAILABILITY_COPY[status as AvailabilityStatus] ?? AVAILABILITY_COPY.not_looking;
  const tone: Record<string, string> = {
    not_looking: "bg-surface-muted text-text-secondary",
    open_to_opportunities: "bg-secondary text-brand",
    open_to_jobs: "bg-secondary text-brand",
    open_to_gigs: "bg-[#ecf8f3] text-success",
    available_immediately: "bg-[#ecf8f3] text-success",
    engaged: "bg-[#fbf3e8] text-warning",
    on_leave: "bg-surface-muted text-text-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        tone[status] ?? tone.not_looking,
      )}
      title={copy.hint}
    >
      {labeled ? `Availability: ${copy.label}` : copy.label}
    </span>
  );
}
