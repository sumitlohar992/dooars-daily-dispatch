import { describe, expect, it } from "vitest";
import { getYoutubeLiveEmbed } from "./youtube-live";

describe("getYoutubeLiveEmbed", () => {
  it("embeds YouTube Live, watch, short, and player URLs", () => {
    for (const url of [
      "https://www.youtube.com/live/abcDEFGhijk?feature=share",
      "https://youtu.be/abcDEFGhijk",
      "https://www.youtube.com/watch?v=abcDEFGhijk",
      "https://www.youtube.com/embed/abcDEFGhijk",
    ]) {
      expect(getYoutubeLiveEmbed(url)).toEqual({
        embedUrl: "https://www.youtube-nocookie.com/embed/abcDEFGhijk",
      });
    }
  });

  it("rejects insecure, malformed, and unsupported URLs", () => {
    expect(getYoutubeLiveEmbed("http://www.youtube.com/live/abcDEFGhijk")).toBeNull();
    expect(getYoutubeLiveEmbed("https://youtube.com/live/short")).toBeNull();
    expect(getYoutubeLiveEmbed("https://example.com/live/abcDEFGhijk")).toBeNull();
    expect(getYoutubeLiveEmbed("https://www.facebook.com/page/videos/123456789/")).toBeNull();
  });
});
