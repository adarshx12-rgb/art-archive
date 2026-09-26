import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { site } from "../config/site";
import { palettes } from "../content/palettes";
import { styles } from "../content/styles";
import { readSaved, writeSaved, type SavedData } from "../lib/storage";
import { useToast } from "./toast";

const known = {
  styles: new Set(styles.map((s) => s.slug)),
  palettes: new Set(palettes.map((p) => p.slug)),
};

interface SavedApi {
  saved: SavedData;
  /** False when localStorage cannot be used; saving then lasts only for this visit. */
  persistent: boolean;
  isSaved: (kind: keyof SavedData, slug: string) => boolean;
  toggle: (kind: keyof SavedData, slug: string, label: string) => void;
  clear: (kind: keyof SavedData) => void;
}

const SavedContext = createContext<SavedApi | null>(null);

export function useSaved(): SavedApi {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [{ data, available }, setState] = useState(() => readSaved(site.storageKey, known));

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === site.storageKey) setState(readSaved(site.storageKey, known));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback(
    (next: SavedData, message: string) => {
      const ok = writeSaved(site.storageKey, next);
      setState({ data: next, available: ok });
      if (ok) toast(message);
      else toast(`${message} for this visit only. Your browser is blocking local storage.`, "error");
    },
    [toast],
  );

  const api = useMemo<SavedApi>(
    () => ({
      saved: data,
      persistent: available,
      isSaved: (kind, slug) => data[kind].includes(slug),
      toggle: (kind, slug, label) => {
        const has = data[kind].includes(slug);
        const next = { ...data, [kind]: has ? data[kind].filter((s) => s !== slug) : [...data[kind], slug] };
        commit(next, has ? `Removed “${label}” from Saved` : `Saved “${label}”`);
      },
      clear: (kind) => commit({ ...data, [kind]: [] }, kind === "styles" ? "Cleared saved styles" : "Cleared saved palettes"),
    }),
    [data, available, commit],
  );

  return <SavedContext.Provider value={api}>{children}</SavedContext.Provider>;
}
