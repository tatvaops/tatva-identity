import { publicMediaUrl } from "@/lib/media/public-url";
import { cn } from "@/lib/utils";

export function MediaPhoto({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const url = publicMediaUrl(src);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={className} />
  );
}

export function PhotoFrame({
  src,
  alt,
  className,
  imgClassName,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const url = publicMediaUrl(src);
  if (!url) return null;
  return (
    <div className={cn("overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className={cn("h-full w-full object-cover", imgClassName)} />
    </div>
  );
}
