const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export function youtubeVideoId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (url.hostname.replace(/^www\./, "") === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
      return isYoutubeId(id) ? id : null;
    }
    const fromQuery = url.searchParams.get("v");
    if (fromQuery && isYoutubeId(fromQuery)) return fromQuery;
    const embed = url.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/);
    return embed?.[1] && isYoutubeId(embed[1]) ? embed[1] : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(value: string | null | undefined): string | null {
  const id = youtubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function isUploadedVideoRef(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const path = (() => {
    try {
      return new URL(trimmed).pathname;
    } catch {
      return trimmed.split("?")[0] ?? trimmed;
    }
  })();
  return /\.(mp4|webm)$/i.test(path);
}

export function isPlayableVideoRef(value: string | null | undefined): boolean {
  return Boolean(youtubeVideoId(value) || isUploadedVideoRef(value));
}

function isYoutubeId(value: string) {
  return /^[\w-]{11}$/.test(value);
}
