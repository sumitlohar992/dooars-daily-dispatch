import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PAGE_SIZE, fetchArticles, timeAgo, type Article } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dooars Khabar — Breaking news from the Dooars, Bengal & India" },
      { name: "description", content: "Latest local, West Bengal, national, politics, sports and entertainment news from Dooars Khabar." },
      { property: "og:title", content: "Dooars Khabar — Breaking news" },
      { property: "og:description", content: "Latest local, West Bengal and national news from Dooars Khabar." },
    ],
  }),
  component: Home,
});

const TABS = ["All", ...CATEGORIES];

function Ticker() {
  const { data } = useQuery({
    queryKey: ["breaking"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("id,title").eq("is_breaking", true).order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });
  const { t } = useT();
  if (!data?.length) return null;
  const items = [...data, ...data];
  return (
    <div className="flex items-center overflow-hidden border-b bg-card">
      <span className="z-10 shrink-0 bg-breaking px-3 py-2 text-xs font-black uppercase tracking-wider text-breaking-foreground">
        {t("breaking")}
      </span>
      <div className="overflow-hidden">
        <div className="flex w-max animate-ticker gap-8 whitespace-nowrap py-2 pl-4 text-sm font-semibold">
          {items.map((a, i) => (
            <Link key={i} to="/article/$id" params={{ id: a.id }} className="hover:text-sky">
              • {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Featured({ items }: { items: Article[] }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % items.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => clearInterval(t);
  }, [items.length]);
  if (!items.length) return null;
  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {items.map((a) => (
          <Link key={a.id} to="/article/$id" params={{ id: a.id }} className="relative aspect-[16/10] w-full shrink-0 snap-start bg-muted">
            {a.image_url && <img src={a.image_url} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-fade" />
            <div className="absolute inset-x-0 bottom-0 p-4 pb-7 text-primary-foreground">
              <span className="rounded bg-sky px-2 py-0.5 text-[11px] font-bold uppercase text-secondary-foreground">{a.category}</span>
              <h2 className="mt-2 line-clamp-2 text-xl font-extrabold leading-tight">{a.title}</h2>
              <p className="mt-1 text-xs opacity-80">{a.author_name} · {timeAgo(a.created_at)}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {items.map((_, k) => (
          <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-sky" : "w-1.5 bg-primary-foreground/60"}`} />
        ))}
      </div>
    </div>
  );
}

function Home() {
  const [tab, setTab] = useState("All");
  const { t: tr } = useT();
  const sentinel = useRef<HTMLDivElement>(null);
  const q = useInfiniteQuery({
    queryKey: ["feed", tab],
    queryFn: ({ pageParam }) => fetchArticles({ category: tab, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length : undefined),
  });
  const all = q.data?.pages.flat() ?? [];
  const featured = tab === "All" ? all.filter((a) => a.image_url).slice(0, 4) : [];
  const rest = tab === "All" ? all.filter((a) => !featured.includes(a)) : all;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const ob = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
    }, { rootMargin: "300px" });
    ob.observe(el);
    return () => ob.disconnect();
  }, [q]);

  return (
    <>
      <Header />
      <Ticker />
      <div className="sticky top-14 z-20 border-b bg-card">
        <div className="no-scrollbar mx-auto flex max-w-xl gap-2 overflow-x-auto px-4 py-2.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === t ? "bg-sky text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tr(t)}
            </button>
          ))}
        </div>
      </div>
      <Page>
        {q.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Featured items={featured} />
            {tab === "All" && rest.length > 0 && (
              <h2 className="px-4 pb-1 pt-5 text-sm font-black uppercase tracking-wider text-primary">{tr("latest")}</h2>
            )}
            {rest.map((a) => <ArticleCard key={a.id} a={a} />)}
            {!all.length && <p className="p-10 text-center text-muted-foreground">{tr("noNews")}</p>}
          </>
        )}
        <div ref={sentinel} />
        {q.isFetchingNextPage && <CardSkeleton />}
        {!q.hasNextPage && all.length > 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">{tr("caughtUp")}</p>
        )}
      </Page>
    </>
  );
}
