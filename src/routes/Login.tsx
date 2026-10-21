import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { takeReturn, useAuth } from "../auth";
import { GoogleIcon, useTitle } from "../components/bits";
import { Opening, arrive, markOpened, type OpeningHandle } from "../components/Opening";
import { api } from "../lib/api";

function oauthError(): string | null {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  return q.get("error_description") || h.get("error_description") || q.get("error") || h.get("error");
}

export default function Login() {
  useTitle("Sign in");
  const { ready, user, membership, membershipError } = useAuth();
  const nav = useNavigate();
  const opening = useRef<OpeningHandle>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(oauthError());
  const [shake, setShake] = useState(0);

  // Signed in (back from Google, or already): once the account check is in, the scene flies into the
  // orb on its own and hands over to where they were going.
  const signedIn = Boolean(user);
  const sceneReady = ready && (!user || membership !== null || membershipError !== null);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => opening.current?.jolt(), 2600);
    return () => window.clearTimeout(t);
  }, [error]);

  async function go() {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const url = await api.googleSignInUrl(`${location.origin}/login`);
      markOpened();
      await opening.current?.leave();
      location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in didn't start.");
      setBusy(false);
      setShake((n) => n + 1);
      opening.current?.jolt();
    }
  }

  const portal = signedIn ? null : (
    <>
      <p className="opening-lbl">Build Cycle C04 · Sensemaking</p>
      <h1 className="opening-h1">Stakeholder Profiles</h1>
      <p className="opening-note">Map the players around The Labs in DC. You'll write three, then read everyone's.</p>
      <div className={`opening-act${shake ? " shake" : ""}`} key={shake}>
        <button type="button" className="opening-btn" onClick={() => void go()} disabled={busy} aria-busy={busy}>
          <GoogleIcon /> {busy ? "Opening Google…" : "Continue with Google"}
        </button>
        <p className="opening-err" role="alert" hidden={!error}>{error ? <><strong>Sign-in didn't work.</strong> {error}</> : " "}</p>
        <p className="opening-hint">Use the Google account you use for OLOS.</p>
      </div>
    </>
  );

  return (
    <Opening
      ref={opening}
      ready={sceneReady}
      portal={portal}
      label={signedIn ? "Signing you in" : "Loading"}
      onDone={() => { markOpened(); arrive(); nav(takeReturn(), { replace: true }); }}
    />
  );
}
