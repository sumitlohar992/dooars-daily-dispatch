import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Smartphone, Share } from "lucide-react";
import { Header, Page } from "@/components/AppShell";

// Put the public link to the built APK here once it is uploaded (e.g. Google Drive or Play Store).
export const APK_URL = "";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download the app — Dooars Khabar" },
      { name: "description", content: "Get the Dooars Khabar app on your Android or iPhone home screen." },
      { property: "og:title", content: "Download the Dooars Khabar app" },
      { property: "og:description", content: "Local Dooars news on your phone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DownloadPage,
});

type BIP = Event & { prompt: () => Promise<void> };

function DownloadPage() {
  const [evt, setEvt] = useState<BIP | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  const card = "rounded-2xl border bg-card p-5 shadow-card";
  return (
    <>
      <Header title="Download the app" />
      <Page>
        <div className="space-y-4 p-4">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <img src="/logo.png" alt="Dooars Khabar" className="h-24 w-24 rounded-3xl shadow-card" />
            <p className="font-display text-2xl font-black">Dooars Khabar on your phone</p>
          </div>
          <div className={card}>
            <p className="flex items-center gap-2 font-bold"><Smartphone className="h-5 w-5 text-primary" /> Android app (APK)</p>
            {APK_URL ? (
              <a href={APK_URL} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground"><Download className="h-5 w-5" /> Download APK</a>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">The Android download is coming soon. Until then, add the app to your home screen below.</p>
            )}
          </div>
          <div className={card}>
            <p className="flex items-center gap-2 font-bold"><Download className="h-5 w-5 text-primary" /> Add to home screen</p>
            {evt ? (
              <button onClick={() => evt.prompt()} className="mt-3 h-12 w-full rounded-full bg-sky font-bold text-secondary-foreground">Install now</button>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><b>Android (Chrome):</b> tap ⋮ menu → "Add to Home screen".</li>
                <li className="flex items-center gap-1"><b>iPhone (Safari):</b> tap <Share className="inline h-4 w-4" /> → "Add to Home Screen".</li>
              </ul>
            )}
          </div>
        </div>
      </Page>
    </>
  );
}
