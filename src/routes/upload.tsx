import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useT } from "@/lib/i18n";
import { uploadMedia, validateMediaFile } from "@/lib/media";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload News — Dooars Khabar" },
      { name: "description", content: "Share a news story from your area with photos or video." },
      { property: "og:title", content: "Upload your news — Dooars Khabar" },
      { property: "og:description", content: "Be a citizen reporter on Dooars Khabar." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    edit: typeof s["edit"] === "string" ? s["edit"] : undefined,
  }),
  component: UploadPage,
});

async function uploadFile(userId: string, file: File) {
  const videoExtensions = new Set(["mp4", "webm", "mov", "m4v"]);
  const extension = file.name.split(".").pop()?.toLowerCase();
  const kind = file.type.startsWith("video/")
    || (extension ? videoExtensions.has(extension) : false)
    ? "video"
    : "image";
  validateMediaFile(file, kind);
  return uploadMedia(userId, file, kind);
}

/** Grabs a frame ~1s into the video and returns it as a JPEG file for the thumbnail. */
function videoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (f: File | null) => {
      URL.revokeObjectURL(url);
      resolve(f);
    };
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    v.onloadeddata = () => {
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      const scale = Math.min(1, 1280 / (v.videoWidth || 1280));
      c.width = (v.videoWidth || 1280) * scale;
      c.height = (v.videoHeight || 720) * scale;
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(
        (b) => done(b ? new File([b], "thumbnail.jpg", { type: "image/jpeg" }) : null),
        "image/jpeg",
        0.85,
      );
    };
    v.onerror = () => done(null);
    setTimeout(() => done(null), 15000);
  });
}

function UploadPage() {
  const { edit } = Route.useSearch();
  const { user, displayName, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Local");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageIsAi, setImageIsAi] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useT();
  const [existing, setExisting] = useState<{
    image_url: string | null;
    image_is_ai: boolean;
    video_url: string | null;
  } | null>(null);
  useEffect(() => {
    if (!edit) {
      setExisting(null);
      return;
    }
    supabase
      .from("articles")
      .select("*")
      .eq("id", edit)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setTitle(data.title);
        setCategory(data.category);
        setBody(data.body);
        setExisting({
          image_url: data.image_url,
          image_is_ai: data.image_is_ai,
          video_url: data.video_url,
        });
      });
  }, [edit]);

  if (loading)
    return (
      <>
        <Header title={t("uploadNews")} />
        <Page>
          <div />
        </Page>
      </>
    );
  if (!user)
    return (
      <>
        <Header title={t("uploadNews")} />
        <Page>
          <SignInPrompt message={t("signInUpload")} />
        </Page>
      </>
    );

  const wrap = (before: string, after = before) => {
    const el = bodyRef.current;
    if (!el) return undefined;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = body.slice(s, e) || "text";
    setBody(body.slice(0, s) + before + sel + after + body.slice(e));
    requestAnimationFrame(() => el.focus());
    return undefined;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (title.trim().length < 5) {
      toast.error("Please write a headline (at least 5 letters)");
      return;
    }
    if (body.trim().length < 20) {
      toast.error("Please write a little more about the story");
      return;
    }
    setBusy(true);
    try {
      const thumb = !image && video ? await videoThumbnail(video) : null;
      const image_url = image
        ? await uploadFile(user.id, image)
        : thumb
          ? await uploadFile(user.id, thumb)
          : (existing?.image_url ?? null);
      const image_is_ai = image ? imageIsAi : thumb ? false : (existing?.image_is_ai ?? false);
      const video_url = video ? await uploadFile(user.id, video) : (existing?.video_url ?? null);
      const summary = body.replace(/[#*]/g, "").trim().split("\n")[0]?.slice(0, 160) ?? "";
      const fields = {
        title: title.trim(),
        category,
        body,
        summary,
        image_url,
        image_is_ai,
        video_url,
      };
      const { data, error } = edit
        ? await supabase.from("articles").update(fields).eq("id", edit).select("id").single()
        : await supabase
            .from("articles")
            .insert({ ...fields, author_id: user.id, author_name: displayName })
            .select("id")
            .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["article", data.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["my-articles"] });
      toast.success(edit ? "Changes saved" : "Your news is live!");
      nav({ to: "/article/$id", params: { id: data.id } });
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const label = "mb-1.5 block text-sm font-bold";
  const field = "w-full rounded-xl border bg-card px-4 outline-none focus:ring-2 focus:ring-ring";

  return (
    <>
      <Header title={edit ? "Edit post" : t("uploadNews")} />
      <Page>
        <form onSubmit={submit} className="space-y-5 p-4">
          <div>
            <label className={label}>{t("headline")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              placeholder={t("whatHappened")}
              className={`${field} h-12 text-lg font-semibold`}
            />
          </div>

          <div>
            <label className={label}>{t("category")}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${category === c ? "bg-sky text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {t(c)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <MediaPicker
                icon={<ImagePlus className="h-6 w-6" />}
                label={t("addPhoto")}
                accept="image/*"
                file={image}
                onChange={(file) => {
                  setImage(file);
                  setImageIsAi(false);
                }}
              />
            </div>
            <MediaPicker
              icon={<Video className="h-6 w-6" />}
              label={t("addVideo")}
              accept="video/*"
              file={video}
              onChange={setVideo}
            />
          </div>

          <div>
            <label className={label}>{t("fullStory")}</label>
            <div className="overflow-hidden rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring">
              <div className="flex gap-1 border-b bg-muted/50 p-1.5">
                <ToolBtn onClick={() => wrap("**")} label="Bold">
                  <Bold className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => wrap("*")} label="Italic">
                  <Italic className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn onClick={() => wrap("\n\n## ", "\n\n")} label="Heading">
                  <Heading2 className="h-4 w-4" />
                </ToolBtn>
              </div>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder={t("storyPh")}
                className="w-full resize-y bg-transparent p-4 outline-none"
              />
            </div>
          </div>

          <button
            disabled={busy}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-card disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> {t("publishing")}
              </>
            ) : edit ? (
              "Save changes"
            ) : (
              t("publish")
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t("liveNote")}</p>
        </form>
      </Page>
    </>
  );
}

function ToolBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-2 hover:bg-card"
    >
      {children}
    </button>
  );
}

function MediaPicker({
  icon,
  label,
  accept,
  file,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selected = input.files?.[0] ?? null;
    input.value = "";
    if (selected) {
      try {
        validateMediaFile(selected, accept.startsWith("video/") ? "video" : "image");
      } catch (error) {
        toast.error((error as Error).message);
        return;
      }
    }
    onChange(selected);
  };

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-sky bg-sky-soft">
      {url ? (
        <>
          {file!.type.startsWith("image") ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <video src={url} className="h-full w-full object-cover" muted />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove"
            className="absolute right-1.5 top-1.5 rounded-full bg-card p-1 shadow-card"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-sm font-semibold text-primary">
          {icon}
          {label}
          <input type="file" accept={accept} className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}
