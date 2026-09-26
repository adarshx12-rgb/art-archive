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

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOUR[theme]);
}

/**
 * Follows the operating-system setting until the visitor picks a theme;
 * after that the choice is remembered (when storage is available).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = document.documentElement.dataset.theme;
    return t === "dark" || t === "light" ? t : storedTheme() ?? systemTheme();
  });

  useEffect(() => apply(theme), [theme]);

  // Track system changes only while no explicit choice has been made.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => {
      if (!storedTheme()) setTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
