import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";
import { Loader } from "./components/bits";
import { RequireMember, Shell, World } from "./components/Shell";
import { initApi } from "./lib/api";
import { startReveals } from "./lib/motion";
import { configured } from "./lib/supabase";
import Login from "./routes/Login";
import Home from "./routes/Home";
import "./styles/app.css";
import "./styles/labs.css";

const Editor = lazy(() => import("./routes/Editor"));
const View = lazy(() => import("./routes/View"));
const Gallery = lazy(() => import("./routes/Gallery"));
const Print = lazy(() => import("./routes/Print"));
const Reading = lazy(() => import("./routes/Reading"));

const page = (el: JSX.Element) => <RequireMember><Suspense fallback={<Loader center />}>{el}</Suspense></RequireMember>;

const router = createBrowserRouter([
  // The sign-in page is the opening itself: full screen, no bar.
  { path: "/login", element: <Login /> },
  {
    element: <Shell />,
    children: [
      { path: "/", element: page(<Home />) },
      { path: "/profiles/:id/edit", element: page(<Editor />) },
      { path: "/profiles/:id", element: page(<View />) },
      { path: "/gallery", element: page(<Gallery />) },
      { path: "/reading", element: page(<Reading />) },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  { path: "/print", element: page(<Print />) },
]);

function NotConfigured() {
  return (
    <>
      <World />
      <div className="gate"><div className="gate-inner">
        <h1 className="h2">This app isn't set up yet.</h1>
        <p className="lede">It needs <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. See the README.</p>
      </div></div>
    </>
  );
}

async function boot() {
  await initApi();
  startReveals();
  const mock = import.meta.env.VITE_MOCK === "1";
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      {configured || mock ? <AuthProvider><RouterProvider router={router} /></AuthProvider> : <NotConfigured />}
    </StrictMode>,
  );
}
void boot();
