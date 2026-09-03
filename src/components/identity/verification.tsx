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
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            flag.state !== "verified" && "opacity-70",
            flag.kind === "tatva" && "bg-indigo-50 text-indigo-800",
            flag.kind === "identity" && "bg-sky-50 text-sky-800",
            flag.kind === "employment" && "bg-slate-100 text-slate-800",
            flag.kind === "trade" && "bg-violet-50 text-violet-800",
            flag.kind === "project" && "bg-cyan-50 text-cyan-900",
            flag.kind === "skill" && "bg-emerald-50 text-emerald-800",
            flag.kind === "credential" && "bg-amber-50 text-amber-900",
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
}: {
  status: string;
}) {
  const copy = AVAILABILITY_COPY[status as AvailabilityStatus] ?? AVAILABILITY_COPY.not_looking;
  const tone: Record<string, string> = {
    not_looking: "bg-slate-100 text-slate-700",
    open_to_opportunities: "bg-indigo-50 text-indigo-800",
    open_to_jobs: "bg-indigo-50 text-indigo-800",
    open_to_gigs: "bg-emerald-50 text-emerald-800",
    available_immediately: "bg-emerald-100 text-emerald-900",
    engaged: "bg-amber-50 text-amber-900",
    on_leave: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tone[status] ?? tone.not_looking,
      )}
      title={copy.hint}
    >
      Availability: {copy.label}
    </span>
  );
}
