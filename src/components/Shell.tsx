import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { rememberReturn, useAuth } from "../auth";
import { ErrorNote, Loader } from "./bits";
import { Opening, arrive, markOpened, openedThisSession } from "./Opening";

export function World() { return <div className="world" aria-hidden="true" />; }

function Bar() {
  const { user, membership, signOut } = useAuth();
  const loc = useLocation();
  const tabs = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const showGallery = Boolean(membership?.member && (membership.unlocked || membership.facilitator));

  // The underline glides to the current tab.
  useLayoutEffect(() => {
    const t = tabs.current, u = line.current; if (!t || !u) return;
    const place = () => {
      const cur = t.querySelector<HTMLElement>('[aria-current="page"]');
      if (!cur) { u.style.opacity = "0"; return; }
      u.style.opacity = "1";
      u.style.width = `${cur.offsetWidth - 24}px`;
      u.style.transform = `translateX(${cur.offsetLeft + 12}px)`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [loc.pathname, showGallery]);

  return (
    <header className="bar">
      <Link className="brand" to="/" viewTransition aria-label="Stakeholder Profiles, The Upskilling Labs: home">
        <span className="logo"><img src="/logo-row.webp" alt="" width={126} height={28} /></span>
        <span className="app">Stakeholder Profiles</span>
      </Link>
      {user && (
        <nav className="tabs" ref={tabs} aria-label="Main">
          {membership?.member && <NavLink className="tab" to="/" end viewTransition>My profiles</NavLink>}
          {showGallery && <NavLink className="tab" to="/gallery" viewTransition>Gallery</NavLink>}
          {membership?.member && <NavLink className="tab" to="/reading" viewTransition>Reading</NavLink>}
          <button type="button" className="tab" onClick={() => void signOut()}>Sign out</button>
          <span className="underline" ref={line} aria-hidden="true" />
        </nav>
      )}
    </header>
  );
}

export function Shell() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <World />
      <Bar />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="foot">The Upskilling Labs · Build Cycle C04 sensemaking</footer>
    </>
  );
}

/** Every route but /login: needs a session and an OLOS account. */
export function RequireMember({ children }: { children: ReactNode }) {
  const { ready, user, membership, membershipError } = useAuth();
  const loc = useLocation();
  // The first page load of a browser session opens with the scene (dust, orb, mark); later loads don't.
  const [opening, setOpening] = useState(() => !openedThisSession());
  if (ready && !user) {
    rememberReturn(loc.pathname + loc.search + loc.hash);
    return <Navigate to="/login" replace />;
  }
  const page = <Gatekeeper>{children}</Gatekeeper>;
  if (!opening) return page;
  return (
    <>
      {page}
      <Opening
        ready={ready && (membership !== null || membershipError !== null)}
        onDone={() => { markOpened(); arrive(); setOpening(false); }}
      />
    </>
  );
}

function Gatekeeper({ children }: { children: ReactNode }) {
  const { ready, membership, membershipError, reloadMembership } = useAuth();
  const [retrying, setRetrying] = useState(false);
  if (!ready) return <Loader center />;
  if (membershipError) {
    return (
      <div className="page page-narrow">
        <ErrorNote message={`We couldn't check your account. ${membershipError}`} onRetry={retrying ? undefined : () => { setRetrying(true); void reloadMembership().finally(() => setRetrying(false)); }} />
      </div>
    );
  }
  if (!membership) return <Loader center label="Checking your account" />;
  if (!membership.member) return <NotMember />;
  return <>{children}</>;
}

export function NotMember() {
  const { user, signOut } = useAuth();
  return (
    <div className="gate">
      <div className="gate-inner">
        <h1 className="h2 rv">This app is for members of The Labs.</h1>
        <p className="lede rv">Sign in with the Google account you use for OLOS.</p>
        {user?.email && <p className="small muted rv">You're signed in as {user.email}.</p>}
        <div className="act rv"><button type="button" className="btn btn-primary" onClick={() => void signOut()}>Sign out</button></div>
      </div>
    </div>
  );
}
