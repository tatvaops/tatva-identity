import { publicMediaUrl } from "@/lib/media/public-url";
import { isUploadedVideoRef, youtubeEmbedUrl } from "@/lib/media/youtube";

export function YoutubeEmbed({ url, title }: { url: string | null | undefined; title?: string }) {
  const embed = youtubeEmbedUrl(url);
  if (embed) {
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
  const file = isUploadedVideoRef(url) ? publicMediaUrl(url) : null;
  if (!file) return null;
  return (
    <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-black">
      <video src={file} title={title ?? "Project video"} className="h-full w-full" controls playsInline />
    </div>
  );
}
