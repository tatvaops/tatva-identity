"use client";

import { useState } from "react";
import { publicMediaUrl } from "@/lib/media/public-url";
import { cn } from "@/lib/utils";

export function SafeMediaImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  );
}

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
  return <SafeMediaImg src={url} alt={alt} className={className} />;
}

export function PhotoFrame({
  src,
  alt,
  className,
  imgClassName,
  fallback = true,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: boolean;
}) {
  const url = publicMediaUrl(src);
  const [failed, setFailed] = useState(false);
  const show = Boolean(url) && !failed;
  if (!show && !fallback) return null;
  return (
    <div className={cn("relative overflow-hidden bg-[#eceef4]", className)}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt={alt}
          referrerPolicy="no-referrer"
          className={cn("media-hover-img h-full w-full object-cover", imgClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(17,26,66,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,26,66,.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

export function SafePhotoStrip({
  urls,
  className = "h-28",
}: {
  urls: Array<string | null | undefined>;
  className?: string;
}) {
  const resolved = urls.map((url) => publicMediaUrl(url)).filter((url): url is string => Boolean(url));
  const [failed, setFailed] = useState<string[]>([]);
  const visible = resolved.filter((url) => !failed.includes(url));
  if (visible.length === 0) {
    return <PhotoFrame src={null} alt="" className={className} />;
  }
  const cols = ["grid-cols-1", "grid-cols-2", "grid-cols-3"][Math.min(visible.length, 3) - 1];
  return (
    <div className={cn("grid gap-px bg-border", cols)}>
      {visible.map((url) => (
        <div key={url} className={cn("overflow-hidden", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setFailed((current) => (current.includes(url) ? current : [...current, url]))}
          />
        </div>
      ))}
    </div>
  );
}
