import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

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
    auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
