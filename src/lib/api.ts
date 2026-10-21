import { CYCLE } from "./config";
import { supabase } from "./supabase";
import type { AuthorName, ConfigRow, ProfileDraft, ProfileRow } from "./types";

export interface SessionUser { id: string; email: string | null }

export class ApiError extends Error {
  constructor(message: string, public code?: string, public kind: "network" | "missing" | "locked" | "denied" | "notfound" | "other" = "other") {
    super(message);
  }
}

/** Everything the app asks of the backend. The mock (dev only) implements the same shape. */
export interface Api {
  getUser(): Promise<SessionUser | null>;
  onAuthChange(cb: (u: SessionUser | null) => void): () => void;
  signInWithGoogle(redirectTo: string): Promise<void>;
  /** Starts Google sign-in (PKCE) without leaving the page, so the opening can fly first. */
  googleSignInUrl(redirectTo: string): Promise<string>;
  signOut(): Promise<void>;
  hasOlosAccount(): Promise<boolean>;
  isFacilitator(): Promise<boolean>;
  hasUnlocked(): Promise<boolean>;
  getConfig(): Promise<ConfigRow>;
  listMine(): Promise<ProfileRow[]>;
  listAll(includeDrafts: boolean): Promise<ProfileRow[]>;
  getProfile(id: string): Promise<ProfileRow>;
  createDraft(): Promise<ProfileRow>;
  saveDraft(id: string, patch: Partial<ProfileDraft>): Promise<ProfileRow>;
  submit(id: string, full: ProfileDraft): Promise<ProfileRow>;
  deleteDraft(id: string): Promise<void>;
  authorNames(): Promise<AuthorName[]>;
}

type PgErr = { code?: string; message: string } | null;

function wrap(e: PgErr | Error | unknown): ApiError {
  if (e instanceof ApiError) return e;
  const err = e as { code?: string; message?: string };
  const msg = err?.message ?? String(e);
  if (/fetch|network|Failed to fetch|NetworkError|Load failed/i.test(msg)) return new ApiError("We couldn't reach the server.", err.code, "network");
  if (err?.code === "23514") return new ApiError("Some required fields are still empty.", err.code, "missing");
  if (err?.code === "42501") return new ApiError("You don't have permission to do that.", err.code, "denied");
  if (err?.code === "PGRST116") return new ApiError("We couldn't find that profile.", err.code, "notfound");
  return new ApiError(msg || "Something went wrong.", err?.code);
}

async function rpcBool(fn: string, args?: Record<string, unknown>): Promise<boolean> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw wrap(error);
  return data === true;
}

const realApi: Api = {
  async getUser() {
    const { data, error } = await supabase().auth.getSession();
    if (error) throw wrap(error);
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? null } : null;
  },
  onAuthChange(cb) {
    const { data } = supabase().auth.onAuthStateChange((_evt, session) => {
      const u = session?.user;
      cb(u ? { id: u.id, email: u.email ?? null } : null);
    });
    return () => data.subscription.unsubscribe();
  },
  async signInWithGoogle(redirectTo) {
    const { error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) throw wrap(error);
  },
  async googleSignInUrl(redirectTo) {
    const { data, error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
    if (error) throw wrap(error);
    if (!data.url) throw new Error("Google sign-in didn't start.");
    return data.url;
  },
  async signOut() {
    const { error } = await supabase().auth.signOut();
    if (error) throw wrap(error);
  },
  hasOlosAccount: () => rpcBool("sensemaking_has_olos_account"),
  isFacilitator: () => rpcBool("sensemaking_is_facilitator"),
  hasUnlocked: () => rpcBool("sensemaking_has_unlocked", { p_cycle: CYCLE }),
  async getConfig() {
    const { data, error } = await supabase().from("sensemaking_config").select("*").eq("cycle", CYCLE).single();
    if (error) throw wrap(error);
    return data as ConfigRow;
  },
  async listMine() {
    const { data: u } = await supabase().auth.getUser();
    if (!u.user) return [];
    const { data, error } = await supabase().from("sensemaking_profiles").select("*")
      .eq("cycle", CYCLE).eq("author_id", u.user.id).order("created_at", { ascending: true });
    if (error) throw wrap(error);
    return (data ?? []) as ProfileRow[];
  },
  async listAll(includeDrafts) {
    // Row-level security decides what comes back; this only narrows it.
    let q = supabase().from("sensemaking_profiles").select("*").eq("cycle", CYCLE);
    if (!includeDrafts) q = q.eq("status", "submitted");
    const { data, error } = await q.order("name", { ascending: true, nullsFirst: false });
    if (error) throw wrap(error);
    return (data ?? []) as ProfileRow[];
  },
  async getProfile(id) {
    const { data, error } = await supabase().from("sensemaking_profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw wrap(error);
    if (!data) throw new ApiError("We couldn't find that profile, or it isn't open to you yet.", undefined, "notfound");
    return data as ProfileRow;
  },
  async createDraft() {
    const { data, error } = await supabase().from("sensemaking_profiles").insert({ cycle: CYCLE }).select("*").single();
    if (error) throw wrap(error);
    return data as ProfileRow;
  },
  async saveDraft(id, patch) {
    const { data, error } = await supabase().from("sensemaking_profiles").update(patch).eq("id", id).eq("status", "draft").select("*");
    if (error) throw wrap(error);
    if (!data || data.length === 0) throw new ApiError("This profile can't be edited any more. It may have been submitted, or submissions may be closed.", undefined, "locked");
    return data[0] as ProfileRow;
  },
  async submit(id, full) {
    const { data, error } = await supabase().from("sensemaking_profiles").update({ ...full, status: "submitted" }).eq("id", id).eq("status", "draft").select("*");
    if (error) throw wrap(error);
    if (!data || data.length === 0) throw new ApiError("This profile can't be submitted. It may already be submitted, or submissions may be closed.", undefined, "locked");
    return data[0] as ProfileRow;
  },
  async deleteDraft(id) {
    const { data, error } = await supabase().from("sensemaking_profiles").delete().eq("id", id).eq("status", "draft").select("id");
    if (error) throw wrap(error);
    if (!data || data.length === 0) throw new ApiError("This draft couldn't be deleted.", undefined, "locked");
  },
  async authorNames() {
    const { data, error } = await supabase().rpc("sensemaking_author_names", { p_cycle: CYCLE });
    if (error) throw wrap(error);
    return (data ?? []) as AuthorName[];
  },
};

let impl: Api = realApi;

/** Dev-only: `VITE_MOCK=1` swaps in an in-memory backend. The branch is dropped from production builds. */
export async function initApi(): Promise<void> {
  if (import.meta.env.VITE_MOCK === "1") {
    const m = await import("./mock");
    impl = m.mockApi;
  }
}

export const api: Api = new Proxy({} as Api, {
  get(_t, key: keyof Api) {
    const v = impl[key];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(impl) : v;
  },
});

export { wrap as toApiError };
