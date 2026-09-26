/**
 * Saved items, persisted in localStorage. All access is defensive:
 * storage may be unavailable (privacy modes, blocked cookies), full, or
 * contain malformed data written by an older version or by hand.
 */

export interface SavedData {
  styles: string[];
  palettes: string[];
}

export const emptySaved = (): SavedData => ({ styles: [], palettes: [] });

function getStorage(): Storage | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    // Some browsers expose storage but throw on use.
    const probe = "__ff_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

const isSlug = (x: unknown): x is string => typeof x === "string" && x.length > 0 && x.length < 120;

/** Parses stored JSON, keeping whatever parts are valid. */
export function parseSaved(raw: string | null, known?: { styles: Set<string>; palettes: Set<string> }): SavedData {
  if (!raw) return emptySaved();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptySaved();
  }
  if (!data || typeof data !== "object") return emptySaved();
  const d = data as Record<string, unknown>;
  const clean = (v: unknown, set?: Set<string>) =>
    Array.isArray(v) ? [...new Set(v.filter(isSlug))].filter((s) => !set || set.has(s)) : [];
  return { styles: clean(d.styles, known?.styles), palettes: clean(d.palettes, known?.palettes) };
}

export function readSaved(key: string, known?: { styles: Set<string>; palettes: Set<string> }): {
  data: SavedData;
  available: boolean;
} {
  const s = getStorage();
  if (!s) return { data: emptySaved(), available: false };
  try {
    return { data: parseSaved(s.getItem(key), known), available: true };
  } catch {
    return { data: emptySaved(), available: false };
  }
}

/** Returns false when the write could not be persisted. */
export function writeSaved(key: string, data: SavedData): boolean {
  const s = getStorage();
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
