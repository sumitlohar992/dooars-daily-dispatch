import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";
import { SignInPrompt } from "@/components/SignInPrompt";
import { SavedList } from "@/components/SavedList";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — dooars News" },
      { name: "description", content: "Your profile, saved stories and published news on dooars News." },
      { property: "og:title", content: "Profile — dooars News" },
      { property: "og:description", content: "Your dooars News profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, displayName, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const mine = useQuery({
    queryKey: ["my-articles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*").eq("author_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <><Header title="Profile" /><Page><div /></Page></>;
  if (!user) return <><Header title="Profile" /><Page><SignInPrompt message="Sign in to see your profile." /></Page></>;

  const avatar = user.user_metadata?.["avatar_url"] as string | undefined;
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/", replace: true });
  };

  return (
    <>
      <Header title="Profile" />
      <Page>
        <div className="bg-brand px-4 pb-6 pt-2 text-primary-foreground">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt="" className="h-16 w-16 rounded-full border-2 border-sky object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky font-display text-2xl font-black text-secondary-foreground">{displayName[0]?.toUpperCase()}</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-extrabold">{displayName}</p>
              <p className="truncate text-sm opacity-80">{user.email ?? user.phone}</p>
              <p className="mt-1 text-xs opacity-80">{mine.data?.length ?? 0} stories published</p>
            </div>
            <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 hover:bg-primary-foreground/10"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="sticky top-14 z-10 grid grid-cols-2 border-b bg-card">
          {(["posts", "saved"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`border-b-2 py-3 text-sm font-bold ${tab === t ? "border-sky text-primary" : "border-transparent text-muted-foreground"}`}>
              {t === "posts" ? "My News" : "Saved"}
            </button>
          ))}
        </div>
        {tab === "saved" ? (
          <SavedList userId={user.id} />
        ) : mine.isLoading ? (
          <CardSkeleton />
        ) : mine.data?.length ? (
          mine.data.map((a) => <ArticleCard key={a.id} a={a} />)
        ) : (
          <p className="p-10 text-center text-muted-foreground">You haven't published any news yet.</p>
        )}
      </Page>
    </>
  );
}
