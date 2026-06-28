import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "farmer" | "buyer";
export type UserStatus = "pending" | "approved" | "rejected";

export interface SessionInfo {
  user: any | null;
  session: any | null;
  loading: boolean;
}

export function useSession(): SessionInfo {
  const [state, setState] = useState<SessionInfo>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
