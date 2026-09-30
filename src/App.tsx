import { createBrowserRouter, RouterProvider, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { Recovery } from "./components/Recovery";
import { Home } from "./pages/Home";
import { SavedProvider } from "./state/saved";
import { ToastProvider } from "./state/toast";

function NotFound() {
  return (
    <Recovery
      title="This page doesn’t exist."
      message="The address may be mistyped, or the page may have moved."
      actions={[
        { to: "/", label: "Go to the homepage" },
        { to: "/styles", label: "Browse styles" },
        { to: "/palettes", label: "Browse palettes" },
      ]}
    />
  );
}

function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <Recovery
      title="Something went wrong on this page."
      message="Reloading usually fixes it. If it keeps happening, start again from the homepage."
      actions={[{ to: "/", label: "Go to the homepage" }]}
    />
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    // Shown for the instant a lazily loaded route's code arrives on a direct visit.
    hydrateFallbackElement: <div className="min-h-dvh" />,
    children: [
      { index: true, element: <Home /> },
      // Route-level code splitting: each page loads its own chunk on first visit.
      { path: "styles", lazy: async () => ({ Component: (await import("./pages/Styles")).Styles }) },
      { path: "styles/:slug", lazy: async () => ({ Component: (await import("./pages/StyleDetail")).StyleDetail }) },
      { path: "templates", lazy: async () => ({ Component: (await import("./pages/Templates")).Templates }) },
      { path: "palettes", lazy: async () => ({ Component: (await import("./pages/Palettes")).Palettes }) },
      { path: "palettes/:slug", lazy: async () => ({ Component: (await import("./pages/PaletteDetail")).PaletteDetail }) },
      { path: "saved", lazy: async () => ({ Component: (await import("./pages/Saved")).Saved }) },
      { path: "credits", lazy: async () => ({ Component: (await import("./pages/Credits")).Credits }) },
      { path: "*", element: <NotFound /> },
    ],
  },
  // The builder is a full-screen studio with its own header, opened in a new tab.
  {
    path: "builder",
    errorElement: <RouteError />,
    hydrateFallbackElement: <div className="min-h-dvh" />,
    lazy: async () => ({ Component: (await import("./pages/Builder")).Builder }),
  },
]);

export function App() {
  return (
    <ToastProvider>
      <SavedProvider>
        <RouterProvider router={router} />
      </SavedProvider>
    </ToastProvider>
  );
}
