export type SocialLivePlatform = "youtube" | "facebook";

export type SocialLiveEmbed = {
  platform: SocialLivePlatform;
  embedUrl: string;
};

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.watch"]);

export function getSocialLiveEmbed(value: string): SocialLiveEmbed | null {
  if (value.length > 2048) return null;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const hostname = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(hostname)) {
    const path = url.pathname.replace(/\/+$/, "");
    const videoId =
      hostname === "youtu.be"
        ? path.split("/").filter(Boolean)[0]
        : path === "/watch"
          ? url.searchParams.get("v")
          : path.split("/").filter(Boolean).at(-1);
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null;
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  }

  if (FACEBOOK_HOSTS.has(hostname) && url.pathname !== "/") {
    const shareUrl = new URL(url.href);
    shareUrl.hash = "";
    return {
      platform: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(shareUrl.toString())}&show_text=false`,
    };
  }

  return null;
}
