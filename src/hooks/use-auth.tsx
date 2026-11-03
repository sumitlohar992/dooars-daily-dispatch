import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { user: User | null; loading: boolean; displayName: string; isAdmin: boolean };
const Ctx = createContext<AuthCtx>({ user: null, loading: true, displayName: "", isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const uid = user?.id;
  useEffect(() => {
    if (!uid) { setIsAdmin(false); return; }
    // Records activity for the owner dashboard and checks the owner role.
    supabase.from("user_details").upsert({ user_id: uid, last_seen_at: new Date().toISOString() }, { onConflict: "user_id" }).then(() => {});
    supabase.rpc("has_role", { _user_id: uid, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [uid]);
  const m = user?.user_metadata ?? {};
  const displayName = (m["full_name"] || m["name"] || user?.email?.split("@")[0] || "Reader") as string;
  return <Ctx.Provider value={{ user, loading, displayName, isAdmin }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
