import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CATEGORIES } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { SignInPrompt } from "@/components/SignInPrompt";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload News — dooars News" },
      { name: "description", content: "Share a news story from your area with photos or video." },
      { property: "og:title", content: "Upload your news — dooars News" },
      { property: "og:description", content: "Be a citizen reporter on dooars News." },
    ],
  }),
  component: UploadPage,
});

async function uploadFile(userId: string, file: File) {
  const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2;
  return data.signedUrl;
}

function UploadPage() {
  const { user, displayName, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Local");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <><Header title="Upload News" /><Page><div /></Page></>;
  if (!user) return <><Header title="Upload News" /><Page><SignInPrompt message="Sign in to publish your own news story." /></Page></>;

  const wrap = (before: string, after = before) => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = body.slice(s, e) || "text";
    setBody(body.slice(0, s) + before + sel + after + body.slice(e));
    requestAnimationFrame(() => el.focus());
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (title.trim().length < 5) return toast.error("Please write a headline (at least 5 letters)");
    if (body.trim().length < 20) return toast.error("Please write a little more about the story");
    setBusy(true);
    try {
      const image_url = image ? await uploadFile(user.id, image) : null;
      const video_url = video ? await uploadFile(user.id, video) : null;
      const summary = body.replace(/[#*]/g, "").trim().split("\n")[0].slice(0, 160);
      const { data, error } = await supabase.from("articles").insert({
        author_id: user.id, author_name: displayName, title: title.trim(), category, body, summary, image_url, video_url,
      }).select("id").single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["my-articles"] });
      toast.success("Your news is live!");
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
      <Header title="Upload News" />
      <Page>
        <form onSubmit={submit} className="space-y-5 p-4">
          <div>
            <label className={label}>Headline</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="What happened?" className={`${field} h-12 text-lg font-semibold`} />
          </div>

          <div>
            <label className={label}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button type="button" key={c} onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${category === c ? "bg-sky text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MediaPicker icon={<ImagePlus className="h-6 w-6" />} label="Add photo" accept="image/*" file={image} onChange={setImage} />
            <MediaPicker icon={<Video className="h-6 w-6" />} label="Add video" accept="video/*" file={video} onChange={setVideo} />
          </div>

          <div>
            <label className={label}>Full story</label>
            <div className="overflow-hidden rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring">
              <div className="flex gap-1 border-b bg-muted/50 p-1.5">
                <ToolBtn onClick={() => wrap("**")} label="Bold"><Bold className="h-4 w-4" /></ToolBtn>
                <ToolBtn onClick={() => wrap("*")} label="Italic"><Italic className="h-4 w-4" /></ToolBtn>
                <ToolBtn onClick={() => wrap("\n\n## ", "\n\n")} label="Heading"><Heading2 className="h-4 w-4" /></ToolBtn>
              </div>
              <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)} rows={10}
                placeholder="Tell the full story. Who, what, where, when…" className="w-full resize-y bg-transparent p-4 outline-none" />
            </div>
          </div>

          <button disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-card disabled:opacity-60">
            {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Publishing…</> : "Publish News"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Your story goes live immediately. Please share only true, respectful news.</p>
        </form>
      </Page>
    </>
  );
}

function ToolBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button type="button" aria-label={label} onClick={onClick} className="rounded-md p-2 hover:bg-card">{children}</button>;
}

function MediaPicker({ icon, label, accept, file, onChange }: { icon: React.ReactNode; label: string; accept: string; file: File | null; onChange: (f: File | null) => void }) {
  const url = file ? URL.createObjectURL(file) : null;
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-sky bg-sky-soft">
      {url ? (
        <>
          {file!.type.startsWith("image") ? <img src={url} alt="" className="h-full w-full object-cover" /> : <video src={url} className="h-full w-full object-cover" muted />}
          <button type="button" onClick={() => onChange(null)} aria-label="Remove" className="absolute right-1.5 top-1.5 rounded-full bg-card p-1 shadow-card"><X className="h-4 w-4" /></button>
        </>
      ) : (
        <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-sm font-semibold text-primary">
          {icon}{label}
          <input type="file" accept={accept} className="hidden" onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 50 * 1024 * 1024) { toast.error("File is too large (max 50MB)"); return; }
            onChange(f);
          }} />
        </label>
      )}
    </div>
  );
}
