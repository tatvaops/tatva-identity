import type { ReactNode } from "react";
import { SafeMediaImg } from "@/components/identity/media-photo";
import { cn } from "@/lib/utils";
import { publicMediaUrl } from "@/lib/media/public-url";

const tones: Record<string, string> = {
  site: "from-indigo-800 via-slate-700 to-slate-800",
  studio: "from-indigo-900 via-violet-800 to-stone-600",
  office: "from-slate-800 via-indigo-900 to-slate-700",
  workshop: "from-stone-700 via-amber-900 to-slate-800",
  plant: "from-zinc-800 via-slate-700 to-cyan-900",
  tower: "from-slate-800 via-sky-900 to-stone-700",
  metro: "from-zinc-900 via-slate-700 to-indigo-900",
  campus: "from-emerald-950 via-slate-800 to-stone-700",
  warehouse: "from-neutral-800 via-slate-700 to-amber-950",
};

export function CoverBand({
  tone,
  className,
  children,
  src,
}: {
  tone: string;
  className?: string;
  children?: ReactNode;
  src?: string | null;
}) {
  const image = publicMediaUrl(src);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-r", tones[tone] ?? tones.office, className)}>
      {image ? (
        <SafeMediaImg src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white, transparent 40%)" }} />
      )}
      {children}
    </div>
  );
}

export function InitialsAvatar({
  initials,
  hue,
  size = 48,
  className,
  src,
}: {
  initials: string;
  hue: number;
  size?: number;
  className?: string;
  src?: string | null;
}) {
  const image = publicMediaUrl(src);
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: `hsl(${hue} 42% 38%)`,
      }}
      aria-hidden
    >
      <span className="relative z-0">{initials}</span>
      {image ? <SafeMediaImg src={image} alt="" className="absolute inset-0 z-10 h-full w-full object-cover" /> : null}
    </div>
  );
}
