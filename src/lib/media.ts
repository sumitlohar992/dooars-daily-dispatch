import { supabase } from "@/integrations/supabase/client";
import { Upload } from "tus-js-client";

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
  const declaredType = file.type.toLowerCase();
  const type =
    Object.values(MIME_BY_EXTENSION).find((mime) => mime === declaredType) ??
    (["", "application/octet-stream", "binary/octet-stream"].includes(declaredType) && extension
      ? MIME_BY_EXTENSION[extension]
      : undefined);
  return type && Object.values(MIME_BY_EXTENSION).includes(type) ? type : null;
}

export function validateMediaFile(file: File, kind: "image" | "video" | "profile") {
  const contentType = getMediaContentType(file);
  if (!contentType) {
    throw new Error(
      "Unsupported file format. Use JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV, or M4V.",
    );
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

function getSupabaseUploadConfig() {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Media storage is not configured. Connect Supabase and try again.");
  }
  return { url: url.replace(/\/+$/, ""), key };
}

async function uploadResumable(path: string, file: File, contentType: string): Promise<void> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Could not verify your session: ${error.message}`);
  if (!data.session?.access_token) {
    throw new Error("Your session has expired. Sign in again before uploading.");
  }

  const { url, key } = getSupabaseUploadConfig();
  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${url}/storage/v1/upload/resumable`,
      headers: {
        apikey: key,
        Authorization: `Bearer ${data.session.access_token}`,
      },
      metadata: {
        bucketName: "media",
        objectName: path,
        contentType,
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: true,
      onBeforeRequest: async (request) => {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session?.access_token) {
          throw new Error("Your session expired during upload. Sign in again and retry.");
        }
        request.setHeader("Authorization", `Bearer ${sessionData.session.access_token}`);
      },
      onError: reject,
      onSuccess: () => resolve(),
    });
    upload.start();
  });
}

export async function uploadMedia(userId: string, file: File, kind: "image" | "video" | "profile") {
  const contentType = validateMediaFile(file, kind);
  const extension = file.name.split(".").pop()?.toLowerCase() || contentType.split("/")[1];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${randomId()}-${safeName || `upload.${extension}`}`;

  try {
    await uploadResumable(path, file, contentType);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/failed to fetch|network error|load failed/i.test(message)) {
      throw new Error(
        "Could not reach media storage. Check your internet connection and retry. If it keeps failing, verify the media bucket migration is applied.",
      );
    }
    throw new Error(`Could not upload media: ${message}`);
  }

  const expiries = [60 * 60 * 24 * 365 * 10, 60 * 60 * 24 * 365, 60 * 60 * 24 * 7];
  for (const expiry of expiries) {
    const { data, error } = await supabase.storage.from("media").createSignedUrl(path, expiry);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  await supabase.storage.from("media").remove([path]);
  throw new Error(
    "Media uploaded, but a view link could not be created. Please sign in again and retry.",
  );
}
