import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, Radio, RotateCcw, Square, Users } from "lucide-react";
import { Room, RoomEvent, Track, type LocalTrackPublication, type RemoteTrack } from "livekit-client";
import { Header, Page } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [err, setErr] = useState("");

  const getToken = async (role: "publisher" | "viewer") => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (role === "publisher") {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Sign in before starting a live broadcast.");
      headers.Authorization = `Bearer ${accessToken}`;
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
    const element = track.attach();
    if (track.kind === Track.Kind.Video) {
      element.className = "h-full w-full object-cover";
      remoteMediaRef.current.appendChild(element);
    } else {
      element.className = "hidden";
      remoteMediaRef.current.appendChild(element);
    }
  };

  const join = async (publisher: boolean) => {
    if (connected) return;
    setErr("");
    try {
      const creds = await getToken(publisher ? "publisher" : "viewer");
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room.on(RoomEvent.TrackSubscribed, (track) => attachTrack(track));
      room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((element) => element.remove()));
      room.on(RoomEvent.ParticipantConnected, () => setViewerCount(room.remoteParticipants.size));
      room.on(RoomEvent.ParticipantDisconnected, () => setViewerCount(room.remoteParticipants.size));
      room.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setPublishing(false);
        setViewerCount(0);
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
        setPublishing(true);
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera) as LocalTrackPublication | undefined;
        const localTrack = publication?.track;
        if (localTrack && localVideoRef.current) {
          localTrack.attach(localVideoRef.current);
          localVideoRef.current.muted = true;
        }
      }
    } catch (e) {
      setErr((e as Error).message || "Could not connect to live streaming.");
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  };

  const toggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setCameraEnabled(cameraOn ? false : true);
    setCameraOn((value) => !value);
  };

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(micOn ? false : true);
    setMicOn((value) => !value);
  };

  const switchCamera = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    if (cameras.length < 2) return;
    const publication = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track as (Track & { restartTrack?: (options: MediaTrackConstraints) => Promise<void>; setDeviceId?: (deviceId: string) => Promise<void> }) | undefined;
    const current = track?.mediaStreamTrack?.getSettings().deviceId;
    const next = cameras.find((camera) => camera.deviceId !== current) ?? cameras[0];
    if (next && track?.restartTrack) await track.restartTrack({ deviceId: { exact: next.deviceId } });
  };

  const end = async () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnected(false);
    setPublishing(false);
  };

  useEffect(() => () => roomRef.current?.disconnect(), []);

  return (
    <>
      <Header title="Go Live" />
      <Page>
        <div className="relative aspect-[9/16] max-h-[70vh] w-full overflow-hidden bg-foreground md:aspect-video">
          {publishing ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          ) : (
            <div ref={remoteMediaRef} className="h-full w-full [&>video]:h-full [&>video]:w-full" />
          )}
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-primary-foreground">
              <CameraOff className="h-10 w-10 opacity-70" />
              <button onClick={() => join(false)} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">
                <Users className="h-5 w-5" />Watch live
              </button>
              <button onClick={() => join(true)} disabled={loading || !user} className="flex items-center gap-2 rounded-full bg-breaking px-6 py-3 font-bold text-breaking-foreground disabled:opacity-50">
                <Radio className="h-5 w-5" />Start broadcast
              </button>
              {loading ? <p className="text-sm">Checking sign-in...</p> : !user ? <p className="text-sm">Sign in to start a broadcast.</p> : null}
              {err && <p className="text-sm">{err}</p>}
            </div>
          )}
          {connected && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-breaking px-3 py-1.5 text-xs font-bold text-breaking-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />LIVE
              <span className="ml-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" />{viewerCount}</span>
            </div>
          )}
        </div>
        {publishing ? (
          <div className="flex items-center justify-center gap-3 p-4">
            <button onClick={toggleMic} aria-label={micOn ? "Mute microphone" : "Unmute microphone"} className="rounded-full bg-secondary p-3">
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button onClick={toggleCamera} aria-label={cameraOn ? "Turn camera off" : "Turn camera on"} className="rounded-full bg-secondary p-3">
              {cameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </button>
            <button onClick={switchCamera} aria-label="Switch camera" className="rounded-full bg-secondary p-3"><RotateCcw className="h-5 w-5" /></button>
            <button onClick={end} className="flex items-center gap-2 rounded-full bg-destructive px-5 py-3 font-bold text-destructive-foreground">
              <Square className="h-4 w-4" />End
            </button>
          </div>
        ) : connected ? (
          <div className="flex justify-center p-4">
            <button onClick={end} className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold">Leave live</button>
          </div>
        ) : null}
        {err && connected && <p className="mx-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
      </Page>
    </>
  );
}
