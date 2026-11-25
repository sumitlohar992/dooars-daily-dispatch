import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PAGE_SIZE, fetchArticles, timeAgo, type Article } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";
import { useT } from "@/lib/i18n";
import { Radio, MapPin, Bot } from "lucide-react";

function SlideBar() {
  const { data } = useQuery({
    queryKey: ["slides"],
    queryFn: async () =>
      (await supabase.from("slides").select("*").order("sort").order("created_at")).data ?? [],
  });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!data || data.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % data.length), 4000);
    return () => clearInterval(t);
  }, [data]);
  const s = data?.[i % (data?.length || 1)];
  if (!s) return null;
  const inner = (
    <p key={s.id} className="animate-rise truncate text-center text-sm font-bold">
      {s.title}
    </p>
  );
  return (
    <div className="bg-sky px-4 py-2 text-secondary-foreground">
      {s.link ? (
        <a href={s.link} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-2 px-4 pt-3">
      <Link
        to="/live"
        className="flex items-center justify-center gap-1.5 rounded-full bg-breaking py-2 text-sm font-bold text-breaking-foreground"
      >
        <Radio className="h-4 w-4" />
        Go Live
      </Link>
      <Link
        to="/assistant"
        search={{ mode: "ask" }}
        className="flex items-center justify-center gap-1.5 rounded-full bg-sky-soft py-2 text-sm font-bold text-primary"
      >
        <MapPin className="h-4 w-4" />
        Ask Dooars
      </Link>
      <Link
        to="/assistant"
        search={{ mode: "help" }}
        className="flex items-center justify-center gap-1.5 rounded-full bg-sky-soft py-2 text-sm font-bold text-primary"
      >
        <Bot className="h-4 w-4" />
        Help
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dooars Khabar — Breaking news from the Dooars, Bengal & India" },
      {
        name: "description",
        content:
          "Latest local, West Bengal, national, politics, sports and entertainment news from Dooars Khabar.",
      },
      { property: "og:title", content: "Dooars Khabar — Breaking news" },
      {
        property: "og:description",
        content: "Latest local, West Bengal and national news from Dooars Khabar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const TABS = CATEGORIES;

function Ticker() {
  const { data } = useQuery({
    queryKey: ["breaking"],
    queryFn: async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,title")
        .eq("is_breaking", true)
        .order("created_at", { ascending: false })
        .limit(6);
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
  const { t } = useT();
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
          <Link
            key={a.id}
            to="/article/$id"
            params={{ id: a.id }}
            className="relative aspect-[4/3] w-full shrink-0 snap-start bg-muted sm:aspect-[16/9]"
          >
            {a.image_url && <img src={a.image_url} alt="" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-fade" />
            {a.image_is_ai && (
              <span className="absolute right-3 top-3 rounded bg-foreground/80 px-2 py-1 text-[10px] font-semibold text-background">
                {t("aiIllustration")}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 pb-7 text-primary-foreground">
              <span className="rounded bg-sky px-2 py-0.5 text-[11px] font-bold uppercase text-secondary-foreground">
                {t(a.category)}
              </span>
              <h2 className="mt-2 line-clamp-2 text-xl font-extrabold leading-tight">{a.title}</h2>
              <p className="mt-1 text-xs opacity-80">
                {a.author_name} · {timeAgo(a.created_at)}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {items.map((_, k) => (
          <span
            key={k}
            className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-sky" : "w-1.5 bg-primary-foreground/60"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Home() {
  const [tab, setTab] = useState("Local");
  const { t: tr } = useT();
  const sentinel = useRef<HTMLDivElement>(null);
  const q = useInfiniteQuery({
    queryKey: ["feed", tab],
    queryFn: ({ pageParam }) => fetchArticles({ category: tab, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length : undefined),
  });
  const all = q.data?.pages.flat() ?? [];
  const featured = tab === "Local" ? all.filter((a) => a.image_url).slice(0, 4) : [];
  const rest = tab === "Local" ? all.filter((a) => !featured.includes(a)) : all;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [q]);

  return (
    <div className="relative isolate min-h-screen">
      <div>
        <Header />
        <SlideBar />
        <Ticker />
        <div className="sticky top-14 z-20 border-b bg-card">
          <div className="no-scrollbar mx-auto flex max-w-xl md:max-w-3xl lg:max-w-5xl gap-2 overflow-x-auto px-4 py-2.5">
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
          <QuickActions />
          {q.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              {q.isError && (
                <div
                  role="alert"
                  className="mx-4 my-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                >
                  <p>{tr("newsLoadError")}</p>
                  <button
                    onClick={() => q.refetch()}
                    className="shrink-0 font-bold text-primary underline underline-offset-2"
                  >
                    {tr("retry")}
                  </button>
                </div>
              )}
              <Featured items={featured} />
              {tab === "Local" && rest.length > 0 && (
                <h2 className="px-4 pb-1 pt-5 text-sm font-black uppercase tracking-wider text-primary">
                  {tr("latest")}
                </h2>
              )}
              {rest.map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
              {!all.length && !q.isError && (
                <p className="p-10 text-center text-muted-foreground">{tr("noNews")}</p>
              )}
            </>
          )}
          <div ref={sentinel} />
          {q.isFetchingNextPage && <CardSkeleton />}
          {!q.hasNextPage && all.length > 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">{tr("caughtUp")}</p>
          )}
        </Page>
      </div>
    </div>
  );
}
