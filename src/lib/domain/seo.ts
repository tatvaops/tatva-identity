import type { Metadata } from "next";
import { product } from "@/lib/config";
import { publicMediaUrl } from "@/lib/media/public-url";

export function entityMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
}): Metadata {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "";
  const url = origin ? `${origin}${path}` : path;
  const imageUrl = publicMediaUrl(image);
  const desc = description?.trim() || product.tagline;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${product.name}`,
      description: desc,
      url,
      type: "profile",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${title} · ${product.name}`,
      description: desc,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
