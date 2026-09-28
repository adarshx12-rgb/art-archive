import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { site } from "../config/site";
import { useSaved } from "../state/saved";
import { ThemeToggle } from "../state/theme";

const nav = [
  { to: "/styles", label: "Styles" },
  { to: "/palettes", label: "Palettes" },
  { to: "/builder", label: "Prompt Builder", newTab: true },
  { to: "/saved", label: "Saved" },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { saved } = useSaved();
  const count = saved.styles.length + saved.palettes.length;
  return (
    <>
      {nav.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            onClick={onNavigate}
            {...("newTab" in item ? { target: "_blank", rel: "noopener" } : {})}
            className={({ isActive }) =>
              `relative inline-flex min-h-10 items-center gap-1.5 px-1 text-[0.9375rem] decoration-2 underline-offset-[6px] hover:underline ${
                isActive ? "font-semibold underline decoration-ink" : ""
              }`
            }
          >
            {item.label}
            {"newTab" in item && <span className="sr-only"> (opens in a new tab)</span>}
            {item.to === "/saved" && count > 0 && (
              <span className="meta rounded-[2px] bg-acid px-1 text-on-acid" aria-label={`${count} saved`}>
                {count}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const prevPath = useRef(pathname);

  // On route change: close the menu, return to top, move focus to main for screen readers.
  useEffect(() => {
    setOpen(false);
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Referenced by links that open the builder in a new tab. */}
      <span id="new-tab-note" hidden>
        Opens in a new tab
      </span>
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-[2px]">
        <div className="wrap flex h-14 items-center justify-between gap-4">
          <Link to="/" className="text-[1.05rem] font-extrabold tracking-[-0.03em] whitespace-nowrap" aria-label={`${site.name} home`}>
            {site.name}
          </Link>
          <div className="flex items-center gap-6">
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-6">
                <NavItems />
              </ul>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className="btn btn-ghost btn-sm md:hidden"
                aria-expanded={open}
                aria-controls="mobile-nav"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
                Menu
              </button>
            </div>
          </div>
        </div>
        <nav id="mobile-nav" aria-label="Main" hidden={!open} className="border-t border-rule md:hidden">
          <ul className="wrap flex flex-col py-2">
            <NavItems onNavigate={() => setOpen(false)} />
          </ul>
        </nav>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none focus-visible:shadow-none focus-visible:outline-none">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-ink">
        <div className="wrap grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-2xl font-extrabold tracking-[-0.03em]">{site.name}</p>
            <p className="mt-2 max-w-sm text-[0.9375rem] text-muted">
              A reference library for visual styles and colour, with a prompt builder. It writes prompts; it does not generate images or video.
            </p>
          </div>
          <nav aria-label="Footer" className="lg:col-span-3">
            <p className="meta mb-3 text-muted">Browse</p>
            <ul className="space-y-1.5 text-[0.9375rem]">
              <li><Link className="hover:underline" to="/styles">All styles</Link></li>
              <li><Link className="hover:underline" to="/palettes">All palettes</Link></li>
              <li><Link className="hover:underline" to="/builder" target="_blank" rel="noopener">Prompt builder<span className="sr-only"> (opens in a new tab)</span></Link></li>
              <li><Link className="hover:underline" to="/saved">Saved items</Link></li>
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <p className="meta mb-3 text-muted">About the imagery</p>
            <p className="text-[0.9375rem] text-muted">
              Style artwork is a mix of original illustrative studies (labelled) and openly licensed references from Wikimedia Commons.
            </p>
            <Link to="/credits" className="mt-2 inline-block text-[0.9375rem] underline underline-offset-2">
              Image credits &amp; licences
            </Link>
          </div>
        </div>
        <div className="wrap border-t border-rule py-4">
          <p className="meta text-muted">Saved items are stored only in this browser. Hex values express colour intent; generators may not match them exactly.</p>
        </div>
      </footer>
    </div>
  );
}
