import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  RefreshCw,
  HelpCircle,
  Mail,
  Phone,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
  LayoutDashboard,
  FileText,
  Bot,
  Volume2,
  Download,
  Trash2,
  MessagesSquare,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { SignInPrompt } from "@/components/SignInPrompt";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dooars Khabar" },
      {
        name: "description",
        content: "Update your details, address and photo, get help or contact Dooars Khabar.",
      },
      { property: "og:title", content: "Settings — Dooars Khabar" },
      { property: "og:description", content: "Manage your Dooars Khabar account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const CONTACT_EMAIL = "sumitlohar992@gmail.com";
const EMPTY = { full_name: "", phone: "", address: "", city: "", pincode: "", photo_url: "" };

function SettingsPage() {
  const { user, loading, isAdmin } = useAuth();
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [help, setHelp] = useState(false);
  const [sound, setSound] = useState(true);
  const delFn = useServerFn(deleteMyAccount);
  useEffect(() => {
    setSound(localStorage.getItem("dk-sound") !== "off");
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const m = user.user_metadata ?? {};
        setF({
          full_name: data?.full_name ?? (m["full_name"] as string) ?? "",
          phone: data?.phone ?? user.phone ?? "",
          address: data?.address ?? "",
          city: data?.city ?? "",
          pincode: data?.pincode ?? "",
          photo_url: data?.photo_url ?? (m["avatar_url"] as string) ?? "",
        });
      });
  }, [user]);

  if (loading)
    return (
      <>
        <Header title="Settings" />
        <Page>
          <div />
        </Page>
      </>
    );
  if (!user)
    return (
      <>
        <Header title="Settings" />
        <Page>
          <SignInPrompt message="Sign in to manage your settings." />
        </Page>
      </>
    );

  const set =
    (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data, error: e2 } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (e2 || !data) throw e2;
      setF((p) => ({ ...p, photo_url: data.signedUrl }));
      toast.success("Photo ready — tap Save to keep it");
    } catch (e) {
      toast.error((e as Error).message ?? "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("user_details")
      .upsert({ user_id: user.id, ...f, updated_at: new Date().toISOString() });
    if (!error) {
      await supabase
        .from("profiles")
        .update({ display_name: f.full_name || null, avatar_url: f.photo_url || null })
        .eq("id", user.id);
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Your details are saved");
    }
  };

  const removeAccount = async () => {
    if (
      !confirm(
        "Delete your account forever? Your posts, comments, chats and details will be removed. This cannot be undone.",
      )
    )
      return;
    if (prompt("Type DELETE to confirm") !== "DELETE") return;
    try {
      await delFn();
      await supabase.auth.signOut();
      toast.success("Your account was deleted");
      window.location.href = "/";
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const toggleSound = () => {
    const n = !sound;
    setSound(n);
    localStorage.setItem("dk-sound", n ? "on" : "off");
  };

  const update = async () => {
    toast("Checking for the latest version…");
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    setTimeout(() => window.location.reload(), 600);
  };

  const input =
    "w-full rounded-xl border bg-card px-4 py-3 text-base outline-none focus:border-sky";
  const row = "flex w-full items-center gap-3 border-b px-4 py-4 text-left font-semibold";

  return (
    <>
      <Header title="Settings" />
      <Page>
        <section className="space-y-3 p-4">
          <div className="flex flex-col items-center gap-2 py-2">
            <label className="relative cursor-pointer">
              {f.photo_url ? (
                <img
                  src={f.photo_url}
                  alt="Your photo"
                  className="h-24 w-24 rounded-full border-4 border-sky object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-soft text-3xl font-black text-primary">
                  {(f.full_name || "U")[0]?.toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 rounded-full bg-sky p-2 text-secondary-foreground shadow-card">
                <Camera className="h-4 w-4" />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading photo…" : "Tap to change photo"}
            </p>
          </div>
          <input
            className={input}
            placeholder="Full name"
            value={f.full_name}
            onChange={set("full_name")}
          />
          <input
            className={input}
            placeholder="Phone number"
            inputMode="tel"
            value={f.phone}
            onChange={set("phone")}
          />
          <textarea
            className={input}
            rows={3}
            placeholder="Address"
            value={f.address}
            onChange={set("address")}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={input}
              placeholder="Town / City"
              value={f.city}
              onChange={set("city")}
            />
            <input
              className={input}
              placeholder="PIN code"
              inputMode="numeric"
              value={f.pincode}
              onChange={set("pincode")}
            />
          </div>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </section>

        <section className="mt-2 border-t bg-card">
          {isAdmin && (
            <Link to="/admin" className={row}>
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="flex-1">Owner dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <a href="/download" className={row}>
            <Download className="h-5 w-5 text-primary" />
            <span className="flex-1">Download the app</span>
            <ChevronRight className="h-4 w-4" />
          </a>
          <button onClick={toggleSound} className={row}>
            <Volume2 className="h-5 w-5 text-primary" />
            <span className="flex-1">Welcome sound</span>
            <span className="text-sm text-muted-foreground">{sound ? "On" : "Off"}</span>
          </button>
          <button onClick={update} className={row}>
            <RefreshCw className="h-5 w-5 text-primary" />
            <span className="flex-1">Update app</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setHelp(!help)} className={row}>
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="flex-1">Help</span>
            <ChevronRight className="h-4 w-4" />
          </button>
          {help && (
            <div className="space-y-2 border-b bg-sky-soft px-4 py-4 text-sm">
              <p>
                <b>Read news:</b> tap any story on Home. Use the tabs to pick a category.
              </p>
              <p>
                <b>Post your news:</b> tap the blue + button, add a headline, photo and story, then
                Publish.
              </p>
              <p>
                <b>Save a story:</b> tap the bookmark on a story. Find it under Saved.
              </p>
              <p>
                <b>Change language:</b> tap the language button at the top.
              </p>
            </div>
          )}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Dooars%20Khabar%20help`} className={row}>
            <Mail className="h-5 w-5 text-primary" />
            <span className="flex-1">Contact us by email</span>
            <ChevronRight className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent("Hello Dooars Khabar team")}`}
            target="_blank"
            rel="noreferrer"
            className={row}
          >
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="flex-1">Contact us on WhatsApp</span>
            <ChevronRight className="h-4 w-4" />
          </a>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Report%20a%20problem`} className={row}>
            <Phone className="h-5 w-5 text-primary" />
            <span className="flex-1">Report a problem</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </section>
        <section className="mt-4 border-t bg-card">
          <Link to="/terms" className={row}>
            <FileText className="h-5 w-5 text-primary" />
            <span className="flex-1">Terms and Conditions</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button onClick={removeAccount} className={`${row} text-destructive`}>
            <Trash2 className="h-5 w-5" />
            <span className="flex-1">Delete my account</span>
          </button>
        </section>
        <p className="p-6 text-center text-xs text-muted-foreground">
          Dooars Khabar · Your region. Your voice.
        </p>
      </Page>
    </>
  );
}
