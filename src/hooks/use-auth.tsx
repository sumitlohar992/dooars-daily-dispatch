import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { user: User | null; loading: boolean; displayName: string };
const Ctx = createContext<AuthCtx>({ user: null, loading: true, displayName: "" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
  const m = user?.user_metadata ?? {};
  const displayName = (m.full_name || m.name || user?.email?.split("@")[0] || "Reader") as string;
  return <Ctx.Provider value={{ user, loading, displayName }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
