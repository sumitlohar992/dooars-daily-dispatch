import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ExternalLink, Trash2, Youtube } from "lucide-react";
import { Header, Page } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { getYoutubeLiveEmbed } from "@/lib/youtube-live";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "YouTube Live — Dooars Khabar" },
      { name: "description", content: "Watch and share YouTube Live broadcasts from the Dooars." },
      { property: "og:title", content: "YouTube Live — Dooars Khabar" },
      { property: "og:description", content: "Watch live news from the Dooars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { user } = useAuth();
  const { t } = useT();
  const queryClient = useQueryClient();
  const [streamUrl, setStreamUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const streams = useQuery({
    queryKey: ["youtube-live-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_live_streams")
        .select("*")
        .eq("platform", "youtube")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15_000,
  });

  const saveStream = useMutation({
    mutationFn: async (value: string) => {
      if (!user) throw new Error(t("signInToShareLive"));
      if (!getYoutubeLiveEmbed(value)) throw new Error(t("invalidYoutubeLiveUrl"));

      const { error } = await supabase.from("social_live_streams").upsert(
        {
          user_id: user.id,
          platform: "youtube",
          stream_url: value.trim(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      setStreamUrl("");
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["youtube-live-streams"] });
    },
    onError: (error) => setErrorMessage(error.message),
  });

  const removeStream = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_live_streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: ["youtube-live-streams"] });
    },
    onError: (error) => setErrorMessage(error.message),
  });

  const submitStream = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    saveStream.mutate(streamUrl);
  };

  const featuredStream = streams.data?.[0];
  const featuredEmbed = featuredStream ? getYoutubeLiveEmbed(featuredStream.stream_url) : null;
  const otherStreams = streams.data?.filter((stream) => stream.id !== featuredStream?.id);
  const ownStream = streams.data?.find((stream) => stream.user_id === user?.id);

  return (
    <>
      <Header title={t("goLive")} />
      <Page>
        {featuredStream && featuredEmbed && (
          <section className="space-y-3 border-b px-4 py-6">
            <h2 className="font-display text-lg font-extrabold">{t("youtubeLivePlayerTitle")}</h2>
            <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-xl bg-foreground">
              <iframe
                src={featuredEmbed.embedUrl}
                title={t("youtubeLivePlayerTitle")}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </section>
        )}

        <section className="space-y-3 border-b px-4 py-6">
          <div>
            <h2 className="font-display text-lg font-extrabold">{t("youtubeLiveTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("youtubeLiveDescription")}</p>
          </div>
          <form onSubmit={submitStream} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={streamUrl}
              onChange={(event) => setStreamUrl(event.target.value)}
              placeholder={t("youtubeLiveUrlPlaceholder")}
              aria-label={t("youtubeLiveUrlPlaceholder")}
              maxLength={2048}
              required
              className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={!user || saveStream.isPending}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <Youtube className="h-4 w-4" />
              {ownStream ? t("replaceYouTubeLive") : t("publishYouTubeLive")}
            </button>
          </form>
          {!user && <p className="text-xs text-muted-foreground">{t("signInToShareLive")}</p>}
          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("youtubeEmbedNote")}</p>
        </section>

        <section className="space-y-3 px-4 py-6">
          <h2 className="font-display text-lg font-extrabold">{t("sharedYouTubeLive")}</h2>
          {streams.isPending ? (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          ) : streams.isError ? (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {streams.error.message}
            </p>
          ) : streams.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noYouTubeLive")}</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {otherStreams?.map((stream) => {
                const embed = getYoutubeLiveEmbed(stream.stream_url);
                if (!embed) return null;
                return (
                  <article key={stream.id} className="space-y-2 rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={stream.stream_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 text-sm font-bold text-primary"
                      >
                        {t("youtubeLivePlayerTitle")}
                        <ExternalLink className="h-4 w-4 shrink-0" />
                      </a>
                      {stream.user_id === user?.id && (
                        <button
                          onClick={() => removeStream.mutate(stream.id)}
                          disabled={removeStream.isPending}
                          aria-label={t("removeYouTubeLive")}
                          className="rounded-full p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="aspect-video overflow-hidden rounded-lg bg-foreground">
                      <iframe
                        src={embed.embedUrl}
                        title={t("youtubeLivePlayerTitle")}
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="autoplay; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {featuredStream && user && featuredStream.user_id === user.id && (
            <button
              onClick={() => removeStream.mutate(featuredStream.id)}
              disabled={removeStream.isPending}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {t("removeYouTubeLive")}
            </button>
          )}
        </section>
      </Page>
    </>
  );
}
