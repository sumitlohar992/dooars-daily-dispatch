import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — dooars News" },
      { name: "description", content: "Sign in to save stories, comment and upload your own news." },
      { property: "og:title", content: "Sign in — dooars News" },
      { property: "og:description", content: "Join dooars News." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/", replace: true }); }, [user, nav]);

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account");
    }
    setBusy(false);
  };

  const field = "h-12 w-full rounded-xl border bg-card px-4 outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="min-h-screen bg-brand px-5 pb-28 pt-14 text-primary-foreground">
      <div className="mx-auto max-w-sm animate-rise">
        <div className="text-center">
          <span className="font-display text-4xl font-black italic text-sky">dooars</span>{" "}
          <span className="font-display text-4xl font-black">News</span>
          <p className="mt-2 text-sm opacity-80">Read, share and report news from your area</p>
        </div>
        <div className="mt-8 rounded-3xl bg-card p-6 text-card-foreground shadow-card">
          <button onClick={google} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border font-semibold hover:bg-muted">
            <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} />
            <button disabled={busy} className="h-12 w-full rounded-full bg-sky font-bold text-secondary-foreground disabled:opacity-60">
              {mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm font-semibold text-primary">
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
