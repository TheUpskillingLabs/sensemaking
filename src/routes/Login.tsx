import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { takeReturn, useAuth } from "../auth";
import { GoogleIcon, Loader, useTitle } from "../components/bits";
import { api } from "../lib/api";

function oauthError(): string | null {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  return q.get("error_description") || h.get("error_description") || q.get("error") || h.get("error");
}

export default function Login() {
  useTitle("Sign in");
  const { ready, user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(oauthError());

  useEffect(() => { if (ready && user) nav(takeReturn(), { replace: true, viewTransition: true }); }, [ready, user, nav]);

  async function go() {
    setBusy(true); setError(null);
    try { await api.signInWithGoogle(`${location.origin}/login`); }
    catch (e) { setError(e instanceof Error ? e.message : "Sign-in didn't start."); setBusy(false); }
  }

  if (!ready || user) return <Loader center label={user ? "Signing you in" : "Loading"} />;

  return (
    <div className="gate">
      <div className="gate-inner">
        <p className="eyebrow rv">The Upskilling Labs · Build Cycle C04</p>
        <h1 className="h1 rv">Stakeholder Profiles</h1>
        <p className="lede rv">Map the players around The Labs in DC, one profile at a time. You'll write three, then read everyone's.</p>
        {error && <div className="note note-error rv" role="alert"><strong>Sign-in didn't work.</strong> {error}</div>}
        <div className="act rv">
          <button type="button" className="btn btn-primary google" onClick={() => void go()} disabled={busy} aria-busy={busy}>
            <GoogleIcon /> {busy ? "Opening Google…" : "Continue with Google"}
          </button>
        </div>
        <p className="small muted rv">Use the Google account you use for OLOS.</p>
      </div>
    </div>
  );
}
