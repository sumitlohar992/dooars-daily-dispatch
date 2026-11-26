import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  mp4: "video/mp4",
  webm: "video/webm",
};

export function getMediaContentType(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const type = file.type || (extension ? MIME_BY_EXTENSION[extension] : undefined);
  return type && Object.values(MIME_BY_EXTENSION).includes(type) ? type : null;
}

export function validateMediaFile(file: File, kind: "image" | "video" | "profile") {
  const contentType = getMediaContentType(file);
  if (!contentType) {
    throw new Error("Unsupported file format. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV, or M4V.");
  }

  const isImage = contentType.startsWith("image/");
  if (kind === "profile" || kind === "image") {
    if (!isImage) throw new Error("Please choose an image file.");
  } else if (!contentType.startsWith("video/")) {
    throw new Error("Please choose a video file.");
  }

  const maxSize =
    kind === "video"
      ? MAX_VIDEO_SIZE
      : kind === "profile"
        ? MAX_PROFILE_IMAGE_SIZE
        : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const limitMb = Math.round(maxSize / 1024 / 1024);
    throw new Error(`File is too large. Maximum size is ${limitMb}MB.`);
  }
  if (file.size === 0) throw new Error("This file is empty.");
  return contentType;
}

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadMedia(userId: string, file: File, kind: "image" | "video" | "profile") {
  const contentType = validateMediaFile(file, kind);
  const extension = file.name.split(".").pop()?.toLowerCase() || contentType.split("/")[1];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${randomId()}-${safeName || `upload.${extension}`}`;

  let uploadError: { message: string } | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase.storage
      .from("media")
      .upload(path, file, { contentType, upsert: false, cacheControl: "3600" });
    uploadError = result.error;
    if (!uploadError) break;
  }
  if (uploadError) {
    throw new Error(`Could not upload media: ${uploadError.message}`);
  }

  const expiries = [60 * 60 * 24 * 365 * 10, 60 * 60 * 24 * 365, 60 * 60 * 24 * 7];
  for (const expiry of expiries) {
    const { data, error } = await supabase.storage.from("media").createSignedUrl(path, expiry);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  await supabase.storage.from("media").remove([path]);
  throw new Error("Media uploaded, but a view link could not be created. Please sign in again and retry.");
}
