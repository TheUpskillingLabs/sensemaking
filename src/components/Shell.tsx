import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { rememberReturn, useAuth } from "../auth";
import { ErrorNote, Loader } from "./bits";
import { Opening, arrive, markOpened, openedThisSession } from "./Opening";
import { ReadingSheetProvider } from "./Learn";

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
    // Re-measure once layout settles (fonts, a screen change's view transition) and whenever the tabs change size.
    const raf = requestAnimationFrame(() => requestAnimationFrame(place));
    const ro = new ResizeObserver(place); ro.observe(t);
    window.addEventListener("resize", place);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("resize", place); };
  }, [loc.pathname, showGallery]);

  // On narrow screens the tabs fold into a menu behind an animated hamburger.
  const [menuOpen, setMenuOpen] = useState(false);
  const burger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const close = (refocus = false) => { setMenuOpen(false); if (refocus) burger.current?.focus(); };
  useEffect(() => { setMenuOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("menu-open", menuOpen);
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(true); return; }
      if (e.key !== "Tab" || !menu.current || !burger.current) return;
      // Keep focus between the button and the menu while it's open.
      const items = [burger.current, ...menu.current.querySelectorAll<HTMLElement>("a, button")];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1]?.focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0]?.focus(); }
    };
    const wide = matchMedia("(min-width: 760px)");
    const onWide = () => { if (wide.matches) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => { document.removeEventListener("keydown", onKey); wide.removeEventListener("change", onWide); root.classList.remove("menu-open"); };
  }, [menuOpen]);

  const links = (cls: string) => (
    <>
      {membership?.member && <NavLink className={cls} to="/" end viewTransition>Your profiles</NavLink>}
      {showGallery && <NavLink className={cls} to="/gallery" viewTransition>Gallery</NavLink>}
      {showGallery && <NavLink className={cls} to="/groups" viewTransition>Groups</NavLink>}
      {membership?.member && <NavLink className={cls} to="/reading" viewTransition>Reading</NavLink>}
      {membership?.member && <NavLink className={cls} to="/today" viewTransition>Today</NavLink>}
    </>
  );

  return (
    <header className="bar">
      <Link className="brand" to="/" viewTransition aria-label="Stakeholder Profiles, The Upskilling Labs: home">
        <span className="logo"><img src="/logo-row.webp" alt="" width={126} height={28} /></span>
        <span className="app">Stakeholder Profiles</span>
      </Link>
      {user && (
        <>
          <nav className="tabs" ref={tabs} aria-label="Main">
            {links("tab")}
            <button type="button" className="tab" onClick={() => void signOut()}>Sign out</button>
            <span className="underline" ref={line} aria-hidden="true" />
          </nav>
          <button ref={burger} type="button" className="burger" aria-expanded={menuOpen} aria-controls="main-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
            <span className="burger-box" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <div className="menu-scrim" aria-hidden="true" onClick={() => close()} />
          <div id="main-menu" ref={menu} className="menu" hidden={!menuOpen}>
            <nav aria-label="Main">
              {links("menu-link")}
              <Link className="menu-link menu-sub" to="/tutorial" viewTransition>How to write a profile</Link>
              <a className="menu-link menu-sub" href="/deck/">Saturday's deck</a>
            </nav>
            <div className="menu-foot">
              {user.email && <p className="menu-who">Signed in as {user.email}</p>}
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => void signOut()}>Sign out</button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

// As on the ambassadors site: the header has no bar at the top of a page; once the page moves, a band of
// ink and a soft blur fade in behind it so whatever scrolls under it stays readable.
function useScrolledFlag() {
  useEffect(() => {
    const root = document.documentElement;
    const on = () => { root.dataset.scrolled = window.scrollY > 8 ? "true" : "false"; };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
}

export function Shell() {
  useScrolledFlag();
  return (
    <ReadingSheetProvider>
      <a className="skip" href="#main">Skip to content</a>
      <World />
      <Bar />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="foot">
        <p>The Upskilling Labs, Build Cycle C04. Facilitators can read your profiles. Other participants can once the gallery opens and they've submitted their own.</p>
      </footer>
    </ReadingSheetProvider>
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
      <div className="page">
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
        <p className="lede rv">Sign in with the Google account you signed up to The Labs with.</p>
        {user?.email && <p className="small muted rv">You're signed in as {user.email}.</p>}
        <p className="small muted rv">It's usually the address The Labs emails you at. Still stuck? Post in #c04-all and we'll sort it out tonight.</p>
        <div className="act rv"><button type="button" className="btn btn-primary" onClick={() => void signOut()}>Sign out</button></div>
      </div>
    </div>
  );
}
