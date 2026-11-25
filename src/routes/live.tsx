import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Camera,
  CameraOff,
  ExternalLink,
  Link as LinkIcon,
  Mic,
  MicOff,
  Monitor,
  Radio,
  RotateCcw,
  Square,
  Trash2,
  Users,
} from "lucide-react";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { Header, Page } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getSocialLiveEmbed } from "@/lib/social-live";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Go Live — Dooars Khabar" },
      { name: "description", content: "Broadcast live from your area on Dooars Khabar." },
      { property: "og:title", content: "Go Live — Dooars Khabar" },
      { property: "og:description", content: "Broadcast live news from the Dooars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { user, loading } = useAuth();
  const { t } = useT();
  const queryClient = useQueryClient();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const remoteVideoTracksRef = useRef(new Set<RemoteTrack>());
  const [stageAspectRatio, setStageAspectRatio] = useState(9 / 16);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [connected, setConnected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [screenShareBusy, setScreenShareBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [remoteVideoCount, setRemoteVideoCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [err, setErr] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialError, setSocialError] = useState("");

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  const updateStageAspectRatio = (width?: number, height?: number) => {
    if (width && height) setStageAspectRatio(width / height);
  };

  const updateTrackAspectRatio = (track: RemoteTrack) => {
    if (
      track.source === Track.Source.ScreenShare ||
      ![...remoteVideoTracksRef.current].some(
        (activeTrack) => activeTrack.source === Track.Source.ScreenShare,
      )
    ) {
      const { width, height } = track.mediaStreamTrack.getSettings();
      updateStageAspectRatio(width, height);
    }
  };

  const socialStreams = useQuery({
    queryKey: ["social-live-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_live_streams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15_000,
  });
  const featuredYouTubeStream = socialStreams.data?.find(
    (stream) => getSocialLiveEmbed(stream.stream_url)?.platform === "youtube",
  );
  const featuredYouTubeEmbed = featuredYouTubeStream
    ? getSocialLiveEmbed(featuredYouTubeStream.stream_url)
    : null;
  const additionalSocialStreams = socialStreams.data?.filter(
    (stream) => stream.id !== featuredYouTubeStream?.id,
  );

  const saveSocialLive = useMutation({
    mutationFn: async (value: string) => {
      if (!user) throw new Error(t("signInToBroadcast"));
      const embed = getSocialLiveEmbed(value);
      if (!embed) throw new Error(t("invalidSocialLiveUrl"));
      const { error } = await supabase.from("social_live_streams").upsert(
        {
          user_id: user.id,
          platform: embed.platform,
          stream_url: value.trim(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      setSocialUrl("");
      setSocialError("");
      await queryClient.invalidateQueries({ queryKey: ["social-live-streams"] });
    },
    onError: (error) => setSocialError(error.message),
  });

  const removeSocialLive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_live_streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social-live-streams"] });
    },
    onError: (error) => setSocialError(error.message),
  });

  const getToken = async (role: "publisher" | "viewer") => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (role === "publisher") {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Sign in before starting a live broadcast.");
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch("/api/public/live-token", {
      method: "POST",
      headers,
      body: JSON.stringify({ role, roomName: "dooars-live" }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not join live streaming.");
    return data as { token: string; url: string; canPublish: boolean };
  };

  const attachTrack = (track: RemoteTrack) => {
    if (!remoteMediaRef.current) return;
    if (track.kind === Track.Kind.Video && remoteVideoTracksRef.current.has(track)) {
      return;
    }
    const element = track.attach();
    if (track.kind === Track.Kind.Video) {
      if (!remoteVideoTracksRef.current.has(track)) {
        remoteVideoTracksRef.current.add(track);
        setRemoteVideoCount(remoteVideoTracksRef.current.size);
      }
      element.addEventListener("loadedmetadata", () => updateTrackAspectRatio(track), {
        once: true,
      });
      updateTrackAspectRatio(track);
      element.className =
        track.source === Track.Source.ScreenShare
          ? "h-full w-full object-contain"
          : "h-full w-full object-cover";
    } else {
      element.className = "hidden";
    }
    remoteMediaRef.current.appendChild(element);
  };

  const join = async (publisher: boolean) => {
    if (connected) return;
    setErr("");
    try {
      const creds = await getToken(publisher ? "publisher" : "viewer");
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
        if (track.kind === Track.Kind.Video) {
          remoteVideoTracksRef.current.delete(track);
          setRemoteVideoCount(remoteVideoTracksRef.current.size);
          const activeTrack =
            [...remoteVideoTracksRef.current].find(
              (remoteTrack) => remoteTrack.source === Track.Source.ScreenShare,
            ) ?? [...remoteVideoTracksRef.current][0];
          if (activeTrack) updateTrackAspectRatio(activeTrack);
          else setStageAspectRatio(9 / 16);
        }
      });
      room.on(RoomEvent.ParticipantConnected, () => setViewerCount(room.remoteParticipants.size));
      room.on(RoomEvent.ParticipantDisconnected, () =>
        setViewerCount(room.remoteParticipants.size),
      );
      room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.ScreenShare) {
          setSharingScreen(false);
          const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
          if (cameraTrack) {
            const { width, height } = cameraTrack.mediaStreamTrack.getSettings();
            updateStageAspectRatio(width, height);
          }
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setPublishing(false);
        setSharingScreen(false);
        setScreenShareBusy(false);
        setCameraOn(true);
        setMicOn(true);
        setViewerCount(0);
        remoteVideoTracksRef.current.clear();
        setRemoteVideoCount(0);
        setStageAspectRatio(9 / 16);
        remoteMediaRef.current?.replaceChildren();
      });
      await room.connect(creds.url, creds.token);
      setConnected(true);
      setViewerCount(room.remoteParticipants.size);

      if (!publisher) {
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.track) attachTrack(publication.track as RemoteTrack);
          });
        });
      }

      if (publisher && creds.canPublish) {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        setCameraOn(true);
        setMicOn(true);
        setPublishing(true);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not connect to live streaming.");
      roomRef.current?.disconnect();
      roomRef.current = null;
      setConnected(false);
      setPublishing(false);
    }
  };

  useEffect(() => {
    if (!publishing) return;
    const participant = roomRef.current?.localParticipant;
    const cameraTrack = participant?.getTrackPublication(Track.Source.Camera)?.track;
    const screenTrack = participant?.getTrackPublication(Track.Source.ScreenShare)?.track;
    const cameraElement = localVideoRef.current;
    const screenElement = screenVideoRef.current;

    if (cameraTrack && cameraElement) {
      cameraTrack.attach(cameraElement);
      cameraElement.muted = true;
    }
    if (screenTrack && screenElement) {
      screenTrack.attach(screenElement);
      screenElement.muted = true;
    }
    return () => {
      if (cameraElement) cameraTrack?.detach(cameraElement);
      if (screenElement) screenTrack?.detach(screenElement);
    };
  }, [publishing, sharingScreen]);

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setCameraEnabled(!cameraOn);
      setCameraOn((value) => !value);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change camera state.");
    }
  };

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!micOn);
      setMicOn((value) => !value);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change microphone state.");
    }
  };

  const toggleScreenShare = async () => {
    const room = roomRef.current;
    if (!room) return;
    setErr("");
    setScreenShareBusy(true);
    try {
      await room.localParticipant.setScreenShareEnabled(!sharingScreen, {
        audio: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "include",
        systemAudio: "include",
        contentHint: "motion",
      });
      const activeTrack = room.localParticipant.getTrackPublication(
        sharingScreen ? Track.Source.Camera : Track.Source.ScreenShare,
      )?.track;
      if (activeTrack) {
        const { width, height } = activeTrack.mediaStreamTrack.getSettings();
        updateStageAspectRatio(width, height);
      }
      setSharingScreen(!sharingScreen);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not share the selected screen or tab.");
    } finally {
      setScreenShareBusy(false);
    }
  };

  const switchCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      if (cameras.length < 2) return;
      const publication = roomRef.current?.localParticipant.getTrackPublication(
        Track.Source.Camera,
      );
      const track = publication?.track as
        | (Track & {
            restartTrack?: (options: MediaTrackConstraints) => Promise<void>;
          })
        | undefined;
      const current = track?.mediaStreamTrack?.getSettings().deviceId;
      const next = cameras.find((camera) => camera.deviceId !== current) ?? cameras[0];
      if (next && track?.restartTrack) {
        await track.restartTrack({ deviceId: { exact: next.deviceId } });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not switch camera.");
    }
  };

  const end = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    setPublishing(false);
    setSharingScreen(false);
    setCameraOn(true);
    setMicOn(true);
    remoteVideoTracksRef.current.clear();
    setRemoteVideoCount(0);
    setViewerCount(0);
    setStageAspectRatio(9 / 16);
    remoteMediaRef.current?.replaceChildren();
  };

  useEffect(
    () => () => {
      void roomRef.current?.disconnect();
    },
    [],
  );

  const submitSocialLive = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialError("");
    saveSocialLive.mutate(socialUrl);
  };

  const live = publishing || remoteVideoCount > 0;

  return (
    <>
      <Header title={t("goLive")} />
      <Page>
        <div
          className="relative mx-auto max-h-[70vh] overflow-hidden bg-foreground"
          style={{
            aspectRatio: stageAspectRatio,
            width: viewportHeight
              ? `min(100%, ${Math.floor(viewportHeight * 0.7 * stageAspectRatio)}px)`
              : "100%",
          }}
        >
          <div
            ref={remoteMediaRef}
            className={`absolute inset-0 overflow-hidden [&>video]:h-full [&>video]:w-full ${publishing ? "hidden" : ""}`}
          />
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(event) => {
              updateStageAspectRatio(
                event.currentTarget.videoWidth,
                event.currentTarget.videoHeight,
              );
            }}
            className={`absolute inset-0 h-full w-full object-contain ${publishing && sharingScreen ? "" : "hidden"}`}
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(event) => {
              if (!sharingScreen) {
                updateStageAspectRatio(
                  event.currentTarget.videoWidth,
                  event.currentTarget.videoHeight,
                );
              }
            }}
            className={
              publishing && sharingScreen
                ? "absolute bottom-4 right-4 z-10 h-24 w-20 rounded-lg object-cover shadow-lg md:h-36 md:w-28"
                : publishing
                  ? "absolute inset-0 h-full w-full object-cover"
                  : "hidden"
            }
          />
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-primary-foreground">
              <CameraOff className="h-10 w-10 opacity-70" />
              <button
                onClick={() => join(false)}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
              >
                <Users className="h-5 w-5" />
                {t("watchLive")}
              </button>
              <button
                onClick={() => join(true)}
                disabled={loading || !user}
                className="flex items-center gap-2 rounded-full bg-breaking px-6 py-3 font-bold text-breaking-foreground disabled:opacity-50"
              >
                <Radio className="h-5 w-5" />
                {t("startBroadcast")}
              </button>
              {loading ? (
                <p className="text-sm">{t("checkingSignIn")}</p>
              ) : !user ? (
                <p className="text-sm">{t("signInToBroadcast")}</p>
              ) : null}
              {err && <p className="text-sm">{err}</p>}
            </div>
          )}
          {connected && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-breaking px-3 py-1.5 text-xs font-bold text-breaking-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {live ? "LIVE" : t("waitingForBroadcaster")}
              {live && (
                <span className="ml-1 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {viewerCount}
                </span>
              )}
            </div>
          )}
          {connected && !publishing && remoteVideoCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-primary-foreground">
              {t("waitingForBroadcaster")}
            </div>
          )}
        </div>
        {featuredYouTubeStream && featuredYouTubeEmbed && (
          <section className="space-y-3 border-b px-4 py-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-extrabold">YouTube Live</h2>
              {featuredYouTubeStream.user_id === user?.id && (
                <button
                  onClick={() => removeSocialLive.mutate(featuredYouTubeStream.id)}
                  disabled={removeSocialLive.isPending}
                  aria-label={t("removeSocialLive")}
                  className="rounded-full p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-xl bg-foreground">
              <iframe
                src={featuredYouTubeEmbed.embedUrl}
                title="YouTube Live"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </section>
        )}
        {publishing ? (
          <div className="flex flex-col items-center gap-3 p-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={toggleMic}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                className="rounded-full bg-secondary p-3"
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleCamera}
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                className="rounded-full bg-secondary p-3"
              >
                {cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </button>
              <button
                onClick={switchCamera}
                aria-label="Switch camera"
                className="rounded-full bg-secondary p-3"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={toggleScreenShare}
                disabled={screenShareBusy}
                className="flex items-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                <Monitor className="h-4 w-4" />
                {screenShareBusy ? "…" : sharingScreen ? t("stopSharingScreen") : t("shareScreen")}
              </button>
              <button
                onClick={end}
                className="flex items-center gap-2 rounded-full bg-destructive px-5 py-3 font-bold text-destructive-foreground"
              >
                <Square className="h-4 w-4" />
                End
              </button>
            </div>
            <p className="max-w-xl text-center text-xs text-muted-foreground">
              {t("screenShareHelp")}
            </p>
          </div>
        ) : connected ? (
          <div className="flex justify-center p-4">
            <button
              onClick={end}
              className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold"
            >
              Leave live
            </button>
          </div>
        ) : null}
        {err && connected && (
          <p className="mx-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>
        )}

        <section className="space-y-3 border-t px-4 py-6">
          <div>
            <h2 className="font-display text-lg font-extrabold">{t("socialLiveTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("socialLiveDescription")}</p>
          </div>
          <form onSubmit={submitSocialLive} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={socialUrl}
              onChange={(event) => setSocialUrl(event.target.value)}
              placeholder={t("socialLiveUrlPlaceholder")}
              aria-label={t("socialLiveUrlPlaceholder")}
              maxLength={2048}
              required
              className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={!user || saveSocialLive.isPending}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <LinkIcon className="h-4 w-4" />
              {socialStreams.data?.some((stream) => stream.user_id === user?.id)
                ? t("replaceSocialLive")
                : t("publishSocialLive")}
            </button>
          </form>
          {!user && <p className="text-xs text-muted-foreground">{t("signInToBroadcast")}</p>}
          {socialError && <p className="text-sm text-destructive">{socialError}</p>}
          <p className="text-xs text-muted-foreground">{t("socialEmbedNote")}</p>
        </section>

        {(socialStreams.isPending ||
          socialStreams.isError ||
          !socialStreams.data ||
          socialStreams.data.length === 0 ||
          (additionalSocialStreams?.length ?? 0) > 0) && (
          <section className="space-y-3 px-4 pb-8">
            <h2 className="font-display text-lg font-extrabold">{t("sharedSocialLive")}</h2>
            {socialStreams.isPending ? (
              <div className="h-24 animate-pulse rounded-xl bg-muted" />
            ) : socialStreams.isError ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {socialStreams.error.message}
              </p>
            ) : socialStreams.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noSocialLive")}</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {additionalSocialStreams?.map((stream) => {
                  const embed = getSocialLiveEmbed(stream.stream_url);
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
                          {embed.platform === "youtube" ? "YouTube Live" : "Facebook Live"}
                          <ExternalLink className="h-4 w-4 shrink-0" />
                        </a>
                        {stream.user_id === user?.id && (
                          <button
                            onClick={() => removeSocialLive.mutate(stream.id)}
                            disabled={removeSocialLive.isPending}
                            aria-label={t("removeSocialLive")}
                            className="rounded-full p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="aspect-video overflow-hidden rounded-lg bg-foreground">
                        <iframe
                          src={embed.embedUrl}
                          title={embed.platform === "youtube" ? "YouTube Live" : "Facebook Live"}
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
          </section>
        )}
      </Page>
    </>
  );
}
