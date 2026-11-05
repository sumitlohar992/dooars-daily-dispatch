import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Heart, Users, UserPlus, FileText, BadgeIndianRupee, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { SignInPrompt } from "@/components/SignInPrompt";
import { timeAgo } from "@/lib/news";

export const PARTNER_FOLLOWERS = 500;

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My dashboard — Dooars Khabar" },
      { name: "description", content: "Your posts, views, likes, followers and partner status on Dooars Khabar." },
      { property: "og:title", content: "My dashboard — Dooars Khabar" },
      { property: "og:description", content: "Track your stories on Dooars Khabar." },
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
        supabase.from("articles").select("id,title,views,created_at").eq("author_id", uid).order("created_at", { ascending: false }),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", uid),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", uid),
      ]);
      const ids = (posts.data ?? []).map((p) => p.id);
      const likes = ids.length ? (await supabase.from("reactions").select("*", { count: "exact", head: true }).in("article_id", ids)).count ?? 0 : 0;
      return { posts: posts.data ?? [], followers: fol.count ?? 0, following: ing.count ?? 0, likes, views: (posts.data ?? []).reduce((s, p) => s + p.views, 0) };
    },
  });
  if (loading) return <><Header title="My dashboard" /><Page><div /></Page></>;
  if (!user) return <><Header title="My dashboard" /><Page><SignInPrompt message="Sign in to see your dashboard" /></Page></>;
  const d = q.data;
  const stats = [
    { icon: FileText, label: "Posts", v: d?.posts.length },
    { icon: Eye, label: "Views", v: d?.views },
    { icon: Heart, label: "Likes", v: d?.likes },
    { icon: Users, label: "Followers", v: d?.followers },
    { icon: UserPlus, label: "Following", v: d?.following },
  ];
  const pct = Math.min(100, ((d?.followers ?? 0) / PARTNER_FOLLOWERS) * 100);
  return (
    <>
      <Header title="My dashboard" />
      <Page>
        <div className="grid grid-cols-3 gap-2 p-4 md:grid-cols-5">
          {stats.map(({ icon: I, label, v }) => (
            <div key={label} className="rounded-2xl bg-card p-3 text-center shadow-card">
              <I className="mx-auto h-5 w-5 text-sky" />
              <p className="mt-1 font-display text-xl font-black">{v ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="mx-4 rounded-2xl bg-sky-soft p-4">
          <p className="flex items-center gap-2 font-bold text-primary"><BadgeIndianRupee className="h-5 w-5" />Partner program</p>
          <p className="mt-1 text-sm text-primary">
            {pct >= 100 ? "You qualify! Earnings tracking starts once payouts are set up by the owner." : `${d?.followers ?? 0} / ${PARTNER_FOLLOWERS} followers to unlock earnings.`}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-card"><div className="h-full bg-sky" style={{ width: `${pct}%` }} /></div>
        </div>
        <h2 className="px-4 pb-1 pt-5 text-sm font-black uppercase tracking-wider text-primary">My posts</h2>
        {d?.posts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 border-b bg-card p-4">
            <Link to="/article/$id" params={{ id: p.id }} className="min-w-0 flex-1">
              <p className="truncate font-bold">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.views} views · {timeAgo(p.created_at)}</p>
            </Link>
            <Link to="/upload" search={{ edit: p.id }} aria-label="Edit" className="rounded-full p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></Link>
          </div>
        ))}
        {d && !d.posts.length && <p className="p-8 text-center text-muted-foreground">No posts yet.</p>}
      </Page>
    </>
  );
}
