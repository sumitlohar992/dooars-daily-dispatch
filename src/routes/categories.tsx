import { useT } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  MapPin,
  Map,
  Flag,
  Landmark,
  Trophy,
  Clapperboard,
  Briefcase,
  HeartPulse,
} from "lucide-react";
import { z } from "zod";
import { CATEGORIES, PAGE_SIZE, fetchArticles } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";

const ICONS = [MapPin, Map, Flag, Landmark, Trophy, Clapperboard, Briefcase, HeartPulse];

export const Route = createFileRoute("/categories")({
  validateSearch: z.object({ c: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Categories — Dooars Khabar" },
      {
        name: "description",
        content:
          "Browse news by category: Local, West Bengal, National, Politics, Sports and more.",
      },
      { property: "og:title", content: "News categories — Dooars Khabar" },
      { property: "og:description", content: "Browse news by category on Dooars Khabar." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { c } = Route.useSearch();
  const { t } = useT();
  return (
    <>
      <Header title={t(c ?? "categories")} />
      <Page>{c ? <CategoryFeed category={c} /> : <Grid />}</Page>
    </>
  );
}

function Grid() {
  const { t } = useT();
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {CATEGORIES.map((cat, i) => {
        const Icon = ICONS[i] ?? MapPin;
        return (
          <Link
            key={cat}
            to="/categories"
            search={{ c: cat }}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card transition-transform active:scale-95"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-soft text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-display font-bold">{t(cat)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function CategoryFeed({ category }: { category: string }) {
  const q = useInfiniteQuery({
    queryKey: ["feed", category],
    queryFn: ({ pageParam }) => fetchArticles({ category, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length : undefined),
  });
  const all = q.data?.pages.flat() ?? [];
  const { t } = useT();
  return (
    <>
      <Link to="/categories" className="block px-4 py-3 text-sm font-semibold text-sky">
        {t("allCats")}
      </Link>
      {q.isLoading && <CardSkeleton />}
      {all.map((a) => (
        <ArticleCard key={a.id} a={a} />
      ))}
      {!q.isLoading && !all.length && (
        <p className="p-10 text-center text-muted-foreground">{t("noNews")}</p>
      )}
      {q.hasNextPage && (
        <button
          onClick={() => q.fetchNextPage()}
          className="mx-auto my-4 block rounded-full bg-sky-soft px-5 py-2 text-sm font-semibold text-primary"
        >
          {t("loadMore")}
        </button>
      )}
    </>
  );
}
