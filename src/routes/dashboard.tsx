import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Heart,
  Users,
  UserPlus,
  FileText,
  BadgeIndianRupee,
  Pencil,
  Clock3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { SignInPrompt } from "@/components/SignInPrompt";
import { timeAgo } from "@/lib/news";

export const MONETIZATION_FOLLOWERS = 1000;
export const MONETIZATION_WATCH_HOURS = 2000;

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Creator dashboard — Dooars Khabar" },
      {
        name: "description",
        content: "Your posts, views, likes, followers and monetization progress on Dooars Khabar.",
      },
      { property: "og:title", content: "Creator dashboard — Dooars Khabar" },
      {
        property: "og:description",
        content: "Track your stories and monetization progress on Dooars Khabar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const q = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [posts, fol, ing] = await Promise.all([
        supabase
          .from("articles")
          .select("id,title,views,media_watch_seconds,created_at,image_url,video_url")
          .eq("author_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", uid),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", uid),
      ]);
      const ids = (posts.data ?? []).map((p) => p.id);
      const likes = ids.length
        ? ((
            await supabase
              .from("reactions")
              .select("*", { count: "exact", head: true })
              .in("article_id", ids)
          ).count ?? 0)
        : 0;
      return {
        posts: posts.data ?? [],
        followers: fol.count ?? 0,
        following: ing.count ?? 0,
        likes,
        views: (posts.data ?? []).reduce((s, p) => s + p.views, 0),
        watchHours:
          (posts.data ?? []).reduce(
            (s, p) => s + (p.image_url || p.video_url ? p.media_watch_seconds : 0),
            0,
          ) / 3600,
      };
    },
  });
  if (loading)
    return (
      <>
        <Header title="Creator dashboard" />
        <Page>
          <div />
        </Page>
      </>
    );
  if (!user)
    return (
      <>
        <Header title="Creator dashboard" />
        <Page>
          <SignInPrompt message="Sign in to see your creator dashboard" />
        </Page>
      </>
    );
  const d = q.data;
  const stats = [
    { icon: FileText, label: "Posts", v: d?.posts.length },
    { icon: Eye, label: "Views", v: d?.views },
    { icon: Heart, label: "Likes", v: d?.likes },
    { icon: Users, label: "Followers", v: d?.followers },
    { icon: UserPlus, label: "Following", v: d?.following },
    { icon: Clock3, label: "Watch hours", v: d?.watchHours.toFixed(1) },
  ];
  const followerPct = Math.min(100, ((d?.followers ?? 0) / MONETIZATION_FOLLOWERS) * 100);
  const watchPct = Math.min(100, ((d?.watchHours ?? 0) / MONETIZATION_WATCH_HOURS) * 100);
  const qualified = followerPct >= 100 && watchPct >= 100;
  return (
    <>
      <Header title="Creator dashboard" />
      <Page>
        <div className="px-4 pb-2 pt-4">
          <h2 className="font-display text-xl font-extrabold">Your creator overview</h2>
          <p className="text-sm text-muted-foreground">
            Track your audience, content and monetization progress.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(({ icon: I, label, v }) => (
            <div key={label} className="min-w-0 rounded-2xl bg-card p-3 text-center shadow-card">
              <I className="mx-auto h-5 w-5 text-sky" />
              <p className="mt-1 font-display text-xl font-black">{v ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mx-4 rounded-2xl bg-sky-soft p-4">
          <p className="flex items-center gap-2 font-bold text-primary">
            <BadgeIndianRupee className="h-5 w-5" />
            Monetization
          </p>
          <p className="mt-1 text-sm text-primary">
            {qualified
              ? "You meet the requirements. Earnings for photo and video posts can be enabled by the app owner."
              : "Meet both requirements to become eligible for photo and video earnings."}
          </p>
          <div className="mt-4">
            <div className="flex justify-between gap-2 text-xs font-semibold text-primary">
              <span>Followers</span>
              <span>
                {d?.followers ?? 0} / {MONETIZATION_FOLLOWERS}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
              <div className="h-full bg-sky" style={{ width: `${followerPct}%` }} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between gap-2 text-xs font-semibold text-primary">
              <span>Photo/video watch time</span>
              <span>
                {(d?.watchHours ?? 0).toFixed(1)} / {MONETIZATION_WATCH_HOURS} hours
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-card">
              <div className="h-full bg-sky" style={{ width: `${watchPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Counts active viewing time from signed-in viewers on your photo and video posts.
            </p>
          </div>
        </div>
        <h2 className="px-4 pb-1 pt-5 text-sm font-black uppercase tracking-wider text-primary">
          My posts
        </h2>
        {d?.posts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b bg-card p-4">
            <Link to="/article/$id" params={{ id: p.id }} className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {p.views} views · {timeAgo(p.created_at)}
              </p>
            </Link>
            <Link
              to="/upload"
              search={{ edit: p.id }}
              aria-label="Edit"
              className="rounded-full p-2 hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </div>
        ))}
        {d && !d.posts.length && (
          <p className="p-8 text-center text-muted-foreground">No posts yet.</p>
        )}
      </Page>
    </>
  );
}
