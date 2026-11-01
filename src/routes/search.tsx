import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { fetchArticles } from "@/lib/news";
import { Header, Page } from "@/components/AppShell";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search news — dooars News" },
      { name: "description", content: "Search dooars News for any topic, place or person." },
      { property: "og:title", content: "Search — dooars News" },
      { property: "og:description", content: "Search dooars News for any topic." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setTerm(text.trim().replace(/[,()%]/g, " ")), 350);
    return () => clearTimeout(t);
  }, [text]);
  const q = useQuery({
    queryKey: ["search", term],
    queryFn: () => fetchArticles({ page: 0, search: term }),
    enabled: term.length > 1,
  });
  return (
    <>
      <Header title="Search" />
      <Page>
        <div className="p-4">
          <label className="flex h-12 items-center gap-2 rounded-full border bg-card px-4 shadow-card focus-within:ring-2 focus-within:ring-ring">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search news, places, topics…"
              className="flex-1 bg-transparent outline-none"
            />
          </label>
        </div>
        {q.isFetching && <CardSkeleton />}
        {q.data?.map((a) => <ArticleCard key={a.id} a={a} />)}
        {q.data && !q.data.length && <p className="p-10 text-center text-muted-foreground">No results for “{term}”.</p>}
        {term.length < 2 && <p className="px-4 text-center text-sm text-muted-foreground">Type at least 2 letters to search.</p>}
      </Page>
    </>
  );
}
