import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Heart, Share2, Send, Link2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { shareArticle, shareLinks, timeAgo } from "@/lib/news";
import { Header, Page, PageWatermark } from "@/components/AppShell";
import { RichText } from "@/components/RichText";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/article/$id")({
  head: () => ({
    meta: [
      { title: "News story — Dooars Khabar" },
      { name: "description", content: "Read the full story on Dooars Khabar." },
      { property: "og:title", content: "News story — Dooars Khabar" },
      { property: "og:description", content: "Read the full story on Dooars Khabar." },
      { property: "og:type", content: "article" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { id } = Route.useParams();
  const { t } = useT();
  const router = useRouter();
  const { user, displayName, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const art = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const social = useQuery({
    queryKey: ["social", id, user?.id],
    queryFn: async () => {
      const [r, c, mine, bm] = await Promise.all([
        supabase.from("reactions").select("*", { count: "exact", head: true }).eq("article_id", id),
        supabase.from("comments").select("*").eq("article_id", id).order("created_at", { ascending: false }),
        user ? supabase.from("reactions").select("user_id").eq("article_id", id).eq("user_id", user.id).maybeSingle() : null,
        user ? supabase.from("bookmarks").select("user_id").eq("article_id", id).eq("user_id", user.id).maybeSingle() : null,
      ]);
      return { likes: r.count ?? 0, comments: c.data ?? [], liked: !!mine?.data, saved: !!bm?.data };
    },
  });

  useEffect(() => { supabase.rpc("record_view", { _article_id: id }).then(() => {}); }, [id]);
  const authorId = art.data?.author_id;
  const hasMedia = !!(art.data?.image_url || art.data?.video_url);
  useEffect(() => {
    if (!authorId || authorId === user?.id || !hasMedia || !user) return;
    const recordWatch = (active: boolean) => {
      supabase.rpc("record_media_watch", { _article_id: id, _active: active }).then(({ error }) => {
        if (error) console.error("Could not record media watch time", error);
      });
    };
    recordWatch(document.visibilityState === "visible");
    const visibilityChanged = () => recordWatch(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", visibilityChanged);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") recordWatch(true);
    }, 15_000);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visibilityChanged);
      recordWatch(false);
    };
  }, [authorId, hasMedia, id, user]);
  const follow = useQuery({
    queryKey: ["follow", authorId, user?.id],
    enabled: !!authorId,
    queryFn: async () => {
      const [c, me] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", authorId!),
        user ? supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", authorId!).maybeSingle() : null,
      ]);
      return { count: c.count ?? 0, following: !!me?.data };
    },
  });
  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !authorId) return;
      if (follow.data?.following) await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", authorId);
      else await supabase.from("follows").insert({ follower_id: user.id, following_id: authorId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow", authorId] }),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries(); toast.success("Post deleted"); router.navigate({ to: "/profile" }); },
    onError: () => toast.error("Could not delete"),
  });

  const needLogin = () => { toast("Please sign in first"); router.navigate({ to: "/auth" }); };
  const refresh = () => { qc.invalidateQueries({ queryKey: ["social", id] }); qc.invalidateQueries({ queryKey: ["saved"] }); };

  const toggle = useMutation({
    mutationFn: async (table: "reactions" | "bookmarks") => {
      if (!user) return;
      const on = table === "reactions" ? social.data?.liked : social.data?.saved;
      if (on) await supabase.from(table).delete().eq("article_id", id).eq("user_id", user.id);
      else await supabase.from(table).insert({ article_id: id, user_id: user.id });
      if (table === "bookmarks") toast(on ? "Removed from saved" : "Saved for later");
    },
    onSuccess: refresh,
  });

  const post = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("comments").insert({ article_id: id, user_id: user.id, user_name: displayName, body: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setComment(""); refresh(); },
    onError: () => toast.error("Could not post comment"),
  });

  const a = art.data;
  const back = (
    <button onClick={() => router.history.back()} aria-label="Back" className="-ml-2 rounded-full p-2 hover:bg-primary-foreground/10">
      <ArrowLeft className="h-5 w-5" />
    </button>
  );

  if (art.isLoading) return (<><Header title="" back={back} /><Page><div className="aspect-[16/10] animate-pulse bg-muted" /></Page></>);
  if (!a) return (<><Header title="Not found" back={back} /><Page><p className="p-10 text-center">This story is not available.</p></Page></>);

  const links = shareLinks(a);
  const onShare = async () => { if (!(await shareArticle(a))) { await navigator.clipboard.writeText(`${location.origin}/article/${a.id}`); toast("Link copied"); } };

  return (
    <div className="relative isolate min-h-screen">
      <PageWatermark />
      <div className="relative z-10">
        <Header title={a.category} back={back} />
        <Page>
          {a.image_url && (
            <>
              <div className="relative">
                <img src={a.image_url} alt="" className="aspect-[16/10] w-full object-cover" />
                <img
                  src="/logo.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-3 h-12 w-12 object-contain opacity-40"
                />
              </div>
              {a.image_is_ai && (
                <p className="px-4 pt-2 text-xs text-muted-foreground">{t("aiIllustration")}</p>
              )}
            </>
          )}
        <article className="bg-card px-4 pb-6 pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky">{a.category}</span>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight">{a.title}</h1>
          <div className="mt-3 flex items-center gap-3 border-y py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {a.author_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{a.author_name}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}{a.author_id ? ` · ${follow.data?.count ?? 0} followers` : ""}</p>
            </div>
            {a.author_id && a.author_id !== user?.id && (
              <button onClick={() => (user ? toggleFollow.mutate() : needLogin())} className={`rounded-full px-3 py-1.5 text-xs font-bold ${follow.data?.following ? "bg-muted text-muted-foreground" : "bg-sky text-secondary-foreground"}`}>
                {follow.data?.following ? "Following" : "Follow"}
              </button>
            )}
            <button onClick={() => (user ? toggle.mutate("bookmarks") : needLogin())} aria-label="Save" className="rounded-full p-2 hover:bg-muted">
              <Bookmark className={`h-5 w-5 ${social.data?.saved ? "fill-sky text-sky" : ""}`} />
            </button>
          </div>
          {user && (a.author_id === user.id || isAdmin) && (
            <div className="mt-3 flex gap-2">
              <Link to="/upload" search={{ edit: a.id }} className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold"><Pencil className="h-4 w-4" />Edit</Link>
              <button onClick={() => { if (confirm("Delete this post permanently?")) remove.mutate(); }} className="flex items-center gap-1.5 rounded-full border border-destructive px-4 py-1.5 text-sm font-semibold text-destructive"><Trash2 className="h-4 w-4" />Delete</button>
            </div>
          )}
          {a.summary && <p className="mt-4 text-lg font-medium text-muted-foreground">{a.summary}</p>}
          <RichText text={a.body} />
          {a.source_url && (
            <a href={a.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-sky px-5 py-2 font-bold text-secondary-foreground">
              Read full story on {a.source_name ?? "source"}
            </a>
          )}
          {a.video_url && <video src={a.video_url} poster={a.image_url ?? undefined} controls playsInline className="mt-4 w-full rounded-xl bg-foreground" />}

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => (user ? toggle.mutate("reactions") : needLogin())}
              className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${social.data?.liked ? "border-sky bg-sky-soft text-primary" : ""}`}
            >
              <Heart className={`h-4 w-4 ${social.data?.liked ? "fill-sky text-sky" : ""}`} /> {social.data?.likes ?? 0}
            </button>
            <button onClick={onShare} className="flex h-10 items-center gap-2 rounded-full bg-sky px-4 text-sm font-semibold text-secondary-foreground">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <div className="mt-3 flex gap-2 text-xs font-semibold">
            <a href={links.whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-muted px-3 py-1.5">WhatsApp</a>
            <a href={links.facebook} target="_blank" rel="noreferrer" className="rounded-full bg-muted px-3 py-1.5">Facebook</a>
            <a href={links.x} target="_blank" rel="noreferrer" className="rounded-full bg-muted px-3 py-1.5">X</a>
            <button onClick={async () => { await navigator.clipboard.writeText(`${location.origin}/article/${a.id}`); toast("Link copied"); }} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
              <Link2 className="h-3 w-3" /> Copy
            </button>
          </div>
        </article>

        <section className="mt-2 bg-card p-4">
          <h2 className="font-bold">Comments ({social.data?.comments.length ?? 0})</h2>
          {user ? (
            <form onSubmit={(e) => { e.preventDefault(); if (comment.trim()) post.mutate(); }} className="mt-3 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write a comment…" maxLength={1000} className="h-11 flex-1 rounded-full border bg-background px-4 outline-none focus:ring-2 focus:ring-ring" />
              <button disabled={post.isPending} aria-label="Post" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <button onClick={needLogin} className="mt-3 text-sm font-semibold text-sky">Sign in to comment</button>
          )}
          <ul className="mt-4 space-y-4">
            {social.data?.comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-soft text-sm font-bold text-primary">{c.user_name[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm"><span className="font-semibold">{c.user_name}</span> <span className="text-xs text-muted-foreground">· {timeAgo(c.created_at)}</span></p>
                  <p className="text-sm">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        </Page>
      </div>
    </div>
  );
}
