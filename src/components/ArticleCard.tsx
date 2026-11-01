import { Link } from "@tanstack/react-router";
import { type Article, timeAgo } from "@/lib/news";
import { Newspaper } from "lucide-react";

export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link
      to="/article/$id"
      params={{ id: a.id }}
      className="flex gap-3 border-b bg-card p-4 transition-colors active:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-sky">{a.category}</span>
        <h3 className="mt-0.5 line-clamp-3 text-[15px] font-bold leading-snug">{a.title}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {a.author_name} · {timeAgo(a.created_at)}
        </p>
      </div>
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
        {a.image_url ? (
          <img src={a.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Newspaper className="h-6 w-6" />
          </div>
        )}
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex gap-3 border-b bg-card p-4">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-20 w-28 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
