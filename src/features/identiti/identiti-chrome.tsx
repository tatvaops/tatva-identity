import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { PhotoFrame } from "@/components/identity/media-photo";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export function IdentitiSection({
  eyebrow,
  title,
  action,
  children,
  className,
  boxed = false,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  boxed?: boolean;
}) {
  return (
    <Section eyebrow={eyebrow} title={title} action={action} className={className} boxed={boxed}>
      {children}
    </Section>
  );
}

export function StarRating({ value, count }: { value: number | null; count?: number | null }) {
  if (value == null) return null;
  const filled = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      <span className="flex text-warning" aria-label={`${value.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={cn("size-3.5", index < filled ? "fill-current" : "text-border-strong")} />
        ))}
      </span>
      {count != null ? <span className="text-muted-foreground">{count} verified reviews</span> : null}
    </div>
  );
}

export function OverlayHero({
  src,
  alt,
  children,
  action,
}: {
  src?: string | null;
  alt: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="relative h-56 overflow-hidden sm:h-72 lg:h-80">
      <PhotoFrame src={src} alt={alt} className="absolute inset-0 h-full w-full" imgClassName="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f173c]/88 via-[#0f173c]/25 to-transparent" />
      {action ? <div className="absolute right-4 top-4 z-10">{action}</div> : null}
      <div className="absolute bottom-5 left-5 z-10 text-white sm:bottom-7 sm:left-7">{children}</div>
    </div>
  );
}

export function formatInr(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `${Math.round(value / 100_000)}L`;
  return value.toLocaleString("en-IN");
}

export function visibleAbout(about?: string | null) {
  if (!about) return "";
  return about
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.toLowerCase().startsWith("demonstration profile"))
    .join(". ")
    .replace(/\s+/g, " ")
    .trim();
}

export function IdentitiChip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <Badge variant={active ? "primary" : "outline"} className="rounded-sm px-2 py-1 text-xs font-medium">
      {children}
    </Badge>
  );
}
