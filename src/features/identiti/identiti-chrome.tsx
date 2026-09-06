import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { PhotoFrame } from "@/components/identity/media-photo";
import { cn } from "@/lib/utils";

export function IdentitiSection({
  eyebrow,
  title,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-[#e2e5ef] bg-white p-5 shadow-[0_8px_30px_rgba(25,33,75,.06)] sm:p-6", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#616ee7]">{eyebrow}</p> : null}
          <h2 className="text-xl font-extrabold tracking-tight text-[#111a42] sm:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StarRating({ value, count }: { value: number | null; count?: number | null }) {
  if (value == null) return null;
  const filled = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-bold text-[#17204c]">{value.toFixed(1)}</span>
      <span className="flex text-amber-400" aria-label={`${value.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={cn("size-3.5", index < filled ? "fill-current" : "text-slate-200")} />
        ))}
      </span>
      {count != null ? <span className="text-[#7a7f99]">{count} verified reviews</span> : null}
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
    <div className="relative h-48 overflow-hidden sm:h-64 lg:h-72">
      <PhotoFrame src={src} alt={alt} className="absolute inset-0 h-full w-full" imgClassName="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f173c]/85 via-[#0f173c]/10 to-transparent" />
      {action ? <div className="absolute right-4 top-4 z-10">{action}</div> : null}
      <div className="absolute bottom-5 left-5 z-10 text-white sm:bottom-7 sm:left-7">{children}</div>
    </div>
  );
}

export function TrustRing({ score, insufficient }: { score: number | null; insufficient: boolean }) {
  const value = insufficient || score == null ? 0 : score;
  return (
    <div
      className="relative grid size-24 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#2437d4 ${value}%, #e8eaff 0)` }}
    >
      <div className="grid size-[76px] place-items-center rounded-full bg-white text-center">
        {insufficient || score == null ? (
          <span className="text-sm font-bold text-[#7a7f99]">—</span>
        ) : (
          <div>
            <span className="text-2xl font-black text-[#111a42]">{score}</span>
            <span className="text-xs text-[#7a7f99]">/100</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function formatInr(value: number) {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `${Math.round(value / 100_000)}L`;
  return value.toLocaleString("en-IN");
}

export function IdentitiChip({ children, active = false }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        active ? "border-[#2437d4] bg-[#eef0ff] text-[#2437d4]" : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}
