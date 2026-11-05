import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Radio, CameraOff } from "lucide-react";
import { Header, Page } from "@/components/AppShell";

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
  const ref = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);
  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      setStream(s);
      if (ref.current) { ref.current.srcObject = s; ref.current.muted = true; await ref.current.play(); }
    } catch { setErr("Camera permission was denied."); }
  };
  return (
    <>
      <Header title="Go Live" />
      <Page>
        <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-foreground md:aspect-video">
          <video ref={ref} playsInline className="h-full w-full object-cover" />
          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-primary-foreground">
              <CameraOff className="h-10 w-10 opacity-70" />
              <button onClick={start} className="flex items-center gap-2 rounded-full bg-breaking px-6 py-3 font-bold text-breaking-foreground"><Radio className="h-5 w-5" />Start camera</button>
              {err && <p className="text-sm">{err}</p>}
            </div>
          )}
        </div>
        <p className="m-4 rounded-2xl bg-sky-soft p-4 text-sm text-primary">
          Camera preview works now. Broadcasting to viewers switches on once the live video service is connected — coming soon.
        </p>
      </Page>
    </>
  );
}
