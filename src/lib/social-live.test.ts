import { describe, expect, it } from "vitest";
import { getSocialLiveEmbed } from "./social-live";

describe("getSocialLiveEmbed", () => {
  it("embeds YouTube Live and watch links using the privacy-enhanced player", () => {
    expect(getSocialLiveEmbed("https://www.youtube.com/live/abcDEFGhijk?feature=share")).toEqual({
      platform: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/abcDEFGhijk",
    });
    expect(getSocialLiveEmbed("https://youtu.be/abcDEFGhijk")).toEqual({
      platform: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/abcDEFGhijk",
    });
    expect(getSocialLiveEmbed("https://www.youtube.com/watch?v=abcDEFGhijk")).toEqual({
      platform: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/abcDEFGhijk",
    });
  });

  it("uses Facebook's video player for a public video URL", () => {
    const embed = getSocialLiveEmbed("https://www.facebook.com/page/videos/123456789/");
    expect(embed?.platform).toBe("facebook");
    expect(embed?.embedUrl).toContain("https://www.facebook.com/plugins/video.php?href=");
    expect(embed?.embedUrl).toContain(
      encodeURIComponent("https://www.facebook.com/page/videos/123456789/"),
    );
  });

  it("rejects insecure, malformed, and unsupported URLs", () => {
    expect(getSocialLiveEmbed("http://www.youtube.com/live/abcDEFGhijk")).toBeNull();
    expect(getSocialLiveEmbed("https://youtube.com/live/short")).toBeNull();
    expect(getSocialLiveEmbed("https://example.com/live/abcDEFGhijk")).toBeNull();
  });
});
