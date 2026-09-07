import { youtubeEmbedUrl } from "@/lib/media/youtube";

export function YoutubeEmbed({ url, title }: { url: string | null | undefined; title?: string }) {
  const embed = youtubeEmbedUrl(url);
  if (!embed) return null;
  return (
    <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
      <iframe
        src={embed}
        title={title ?? "Project video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
