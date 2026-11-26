import { describe, expect, it } from "vitest";
import { getMediaContentType, validateMediaFile } from "./media";

describe("media file validation", () => {
  it("uses a supported extension when mobile browsers report a generic MIME type", () => {
    const video = new File(["video"], "clip.mp4", { type: "application/octet-stream" });
    const image = new File(["image"], "photo.jpg", { type: "binary/octet-stream" });

    expect(getMediaContentType(video)).toBe("video/mp4");
    expect(getMediaContentType(image)).toBe("image/jpeg");
    expect(validateMediaFile(video, "video")).toBe("video/mp4");
    expect(validateMediaFile(image, "image")).toBe("image/jpeg");
  });

  it("rejects unsupported formats and mismatched media kinds", () => {
    const unsupported = new File(["file"], "clip.3gp", { type: "application/octet-stream" });
    const image = new File(["image"], "photo.jpg", { type: "image/jpeg" });

    expect(() => validateMediaFile(unsupported, "video")).toThrow("Unsupported file format");
    expect(() => validateMediaFile(image, "video")).toThrow("Please choose a video file");
  });
});
