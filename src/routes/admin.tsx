import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Newspaper, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { banUser, fetchGoogleNewsNow } from "@/lib/admin.functions";
import { timeAgo } from "@/lib/news";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — Dooars Khabar" },
      { name: "description", content: "Owner-only dashboard for Dooars Khabar users and stories." },
      { property: "og:title", content: "Owner dashboard — Dooars Khabar" },
      { property: "og:description", content: "Owner-only area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Stats = {
  total_users: number; active_today: number; active_week: number; new_week: number;
  articles: number; google_articles: number; comments: number;
  users: { id: string; email: string | null; created_at: string; full_name: string | null; phone: string | null; city: string | null; last_seen_at: string | null }[];
};

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const qc = useQueryClient();
  const fetchNow = useServerFn(fetchGoogleNewsNow);
  const [busy, setBusy] = useState(false);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const removeUser = useServerFn(banUser);
  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  const recent = useQuery({
    queryKey: ["admin-articles"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("articles").select("id,title,author_name,created_at").order("created_at", { ascending: false }).limit(30)).data ?? [],
  });

  if (loading) return <><Header title="Owner dashboard" /><Page><div /></Page></>;
  if (!user || !isAdmin) return <><Header title="Owner dashboard" /><Page><p className="p-10 text-center text-muted-foreground">Only the app owner can open this page.</p></Page></>;

  const pull = async () => {
    setBusy(true);
    try {
      const r = await fetchNow();
      toast.success(`${r.added} new stories added from Google News`);
      qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this story?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    error ? toast.error(error.message) : (toast.success("Deleted"), qc.invalidateQueries());
  };
  const removeAccount = async (id: string, label: string) => {
    const reason = window.prompt(`Reason for removing ${label}:`, "Policy violation");
    if (reason === null) return;
    if (!window.confirm(`Permanently remove ${label} and their content?`)) return;
    setRemovingUser(id);
    try {
      const result = await removeUser({ data: { userId: id, reason: reason.trim() || "Policy violation" } });
      toast.success(result.emailBlocked ? "Account removed and its email blocked from signing up again" : "Account removed");
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRemovingUser(null);
    }
  };

  const s = stats.data;
  const cards: [string, number | undefined][] = [
    ["Total users", s?.total_users], ["Active today", s?.active_today], ["Active this week", s?.active_week],
    ["New this week", s?.new_week], ["Stories", s?.articles], ["From Google", s?.google_articles],
  ];

  return (
    <>
      <Header title="Owner dashboard" />
      <Page>
        <div className="grid grid-cols-3 gap-2 p-4">
          {cards.map(([l, v]) => (
            <div key={l} className="rounded-xl bg-sky-soft p-3 text-center">
              <p className="font-display text-2xl font-black text-primary">{v ?? "–"}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="px-4">
          <button onClick={pull} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">
            <Newspaper className="h-5 w-5" />{busy ? "Fetching…" : "Fetch Dooars news from Google now"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">This also runs automatically every hour.</p>
        </div>

        <h2 className="px-4 pt-6 font-display text-lg font-extrabold">Users</h2>
        <ul className="divide-y">
          {s?.users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.full_name || u.email}</p>
                <p className="truncate text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ""}{u.city ? ` · ${u.city}` : ""}</p>
                <p className="text-xs text-muted-foreground">Joined {timeAgo(u.created_at)} · Last active {u.last_seen_at ? timeAgo(u.last_seen_at) : "never"}</p>
              </div>
              {u.id !== user.id && (
                <button
                  onClick={() => removeAccount(u.id, u.full_name || u.email || "this user")}
                  disabled={removingUser !== null}
                  aria-label={`Remove account for ${u.full_name || u.email || "user"}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-destructive px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  {removingUser === u.id ? "Removing…" : "Remove"}
                </button>
              )}
            </li>
          ))}
        </ul>

        <h2 className="px-4 pt-6 font-display text-lg font-extrabold">Latest stories</h2>
        <ul className="divide-y">
          {recent.data?.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <Link to="/article/$id" params={{ id: a.id }} className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.author_name} · {timeAgo(a.created_at)}</p>
              </Link>
              <button onClick={() => del(a.id)} aria-label="Delete story" className="rounded-full p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      </Page>
    </>
  );
}
