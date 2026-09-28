import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/** Keep in sync with the inline script in index.html. */
export const THEME_KEY = "formfield:theme";

const META_COLOUR: Record<Theme, string> = { light: "#F4F2ED", dark: "#151514" };

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOUR[theme]);
}

/**
 * Dark by default; the visitor's choice is remembered (when storage is
 * available).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = document.documentElement.dataset.theme;
    return t === "dark" || t === "light" ? t : storedTheme() ?? "dark";
  });

  useEffect(() => apply(theme), [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Storage blocked: the choice still applies for this visit.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const toDark = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? "Switch to dark mode" : "Switch to light mode"}
      title={toDark ? "Dark mode" : "Light mode"}
      className={`btn btn-ghost btn-sm aspect-square px-0 ${className}`}
    >
      {toDark ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
    </button>
  );
}
