import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArticleCard, CardSkeleton } from "@/components/ArticleCard";

export function SavedList({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ["saved", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("created_at, articles(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((d) => d.articles).filter(Boolean);
    },
  });
  if (q.isLoading) return <CardSkeleton />;
  if (!q.data?.length)
    return (
      <p className="p-10 text-center text-muted-foreground">
        No saved stories yet. Tap the bookmark icon on any story.
      </p>
    );
  return <>{q.data.map((a) => a && <ArticleCard key={a.id} a={a} />)}</>;
}
