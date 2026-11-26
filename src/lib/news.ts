import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Article = Tables<"articles">;

export const CATEGORIES = [
  "Local",
  "West Bengal",
  "National",
  "Politics",
  "Sports",
  "Entertainment",
  "Business",
  "Health",
] as const;

export const PAGE_SIZE = 8;

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function fetchArticles(opts: {
  category?: string;
  page: number;
  search?: string;
  authorId?: string;
}) {
  let q = supabase.from("articles").select("*").order("created_at", { ascending: false });
  if (opts.category && opts.category !== "All") q = q.eq("category", opts.category);
  if (opts.authorId) q = q.eq("author_id", opts.authorId);
  if (opts.search) q = q.or(`title.ilike.%${opts.search}%,body.ilike.%${opts.search}%`);
  const from = opts.page * PAGE_SIZE;
  const { data, error } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return data;
}

export async function shareArticle(a: { id: string; title: string }) {
  const url = `${window.location.origin}/article/${a.id}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: a.title, url });
      return true;
    } catch {
      return true;
    }
  }
  return false;
}

export function shareLinks(a: { id: string; title: string }) {
  const url = encodeURIComponent(
    `${typeof window !== "undefined" ? window.location.origin : ""}/article/${a.id}`,
  );
  const t = encodeURIComponent(a.title);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${url}`,
  };
}
