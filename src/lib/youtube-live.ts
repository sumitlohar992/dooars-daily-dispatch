const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export type YoutubeLiveEmbed = {
  embedUrl: string;
};

export function getYoutubeLiveEmbed(value: string): YoutubeLiveEmbed | null {
  if (value.length > 2048) return null;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  const path = url.pathname.replace(/\/+$/, "");
  const videoId =
    url.hostname.toLowerCase() === "youtu.be"
      ? path.split("/").filter(Boolean)[0]
      : path === "/watch"
        ? url.searchParams.get("v")
        : path.split("/").filter(Boolean).at(-1);
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;

  return {
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}
