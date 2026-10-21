import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type SessionUser } from "./lib/api";
import type { ConfigRow } from "./lib/types";

interface Membership {
  member: boolean;
  facilitator: boolean;
  unlocked: boolean;
  config: ConfigRow;
}

interface AuthState {
  ready: boolean;
  user: SessionUser | null;
  /** Null while loading, or when signed out. */
  membership: Membership | null;
  membershipError: string | null;
  reloadMembership: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);
const RETURN_KEY = "sp.returnTo";

export function rememberReturn(path: string) { try { sessionStorage.setItem(RETURN_KEY, path); } catch { /* storage may be blocked */ } }
export function takeReturn(): string {
  try { const v = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); if (v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/login")) return v; } catch { /* ignore */ }
  return "/";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const loadMembership = useCallback(async () => {
    setMembershipError(null);
    try {
      const [member, facilitator, unlocked, config] = await Promise.all([api.hasOlosAccount(), api.isFacilitator(), api.hasUnlocked(), api.getConfig()]);
      setMembership({ member, facilitator, unlocked, config });
    } catch (e) {
      setMembership(null);
      setMembershipError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api.getUser().then((u) => { if (alive) { setUser(u); setReady(true); } }).catch(() => { if (alive) setReady(true); });
    const off = api.onAuthChange((u) => {
      setUser((prev) => (prev?.id === u?.id ? prev : u));
      if (!u) setMembership(null);
    });
    return () => { alive = false; off(); };
  }, []);

  useEffect(() => { if (user) void loadMembership(); else setMembership(null); }, [user, loadMembership]);

  const signOut = useCallback(async () => {
    try { await api.signOut(); } finally { setUser(null); setMembership(null); }
  }, []);

  const value = useMemo<AuthState>(() => ({ ready, user, membership, membershipError, reloadMembership: loadMembership, signOut }), [ready, user, membership, membershipError, loadMembership, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
