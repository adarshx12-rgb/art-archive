import { useEffect, useState } from "react";
import { aiDraw } from "../ai";
import { cleanDrawing, drawingKey, type Drawing } from "./drawing";

/**
 * AI line drawings for the subjects the sketch has no shape for, keyed by
 * drawingKey(label). Each subject gets a quick sketch first (a few seconds),
 * then the detailed icon replaces it. Detailed drawings are kept in this
 * browser so a reload or a shared link doesn't pay again. A failed request is
 * tried again a few times; if the detailed one fails, the quick one stays.
 */

// v3: outline icons of the subject alone. Older drawings (filled, or with added scenery) are left behind and redrawn.
const STORE = "ff-drawings-v3";
const KEEP = 60;
const TRIES = 3;
const RETRY_MS = 4000;

function load(): Record<string, Drawing> {
  try {
    const raw = JSON.parse(globalThis.localStorage?.getItem(STORE) ?? "{}") as Record<string, unknown>;
    const out: Record<string, Drawing> = {};
    for (const [k, v] of Object.entries(raw)) {
      // Stored data may be old or edited by hand: check it like a fresh reply.
      const d = Array.isArray(v) ? cleanDrawing(v as Drawing) : null;
      if (d) out[k] = d;
    }
    return out;
  } catch {
    return {};
  }
}

function save(key: string, drawing: Drawing) {
  try {
    // Newest last; drop the oldest beyond KEEP.
    const all = load();
    delete all[key];
    all[key] = drawing;
    globalThis.localStorage?.setItem(STORE, JSON.stringify(Object.fromEntries(Object.entries(all).slice(-KEEP))));
  } catch {
    // Storage full or blocked: drawings just won't survive a reload.
  }
}

/** Per subject this session: a request in flight, failures so far, and whether the detailed drawing is in. */
const progress = new Map<string, { busy: boolean; fails: number; full: boolean }>();

export function useDrawings(labels: string[]): Record<string, Drawing> {
  const [drawings, setDrawings] = useState(() => {
    const kept = load();
    Object.keys(kept).forEach((k) => progress.set(k, { busy: false, fails: 0, full: true }));
    return kept;
  });
  // Bumped after a failure so the subject is tried again.
  const [retry, setRetry] = useState(0);
  const want = [...new Set(labels.map(drawingKey).filter(Boolean))]
    .filter((k) => {
      const p = progress.get(k);
      return !p || (!p.full && !p.busy && p.fails < TRIES);
    })
    .join("\n");

  useEffect(() => {
    if (!want) return;
    for (const key of want.split("\n")) {
      const p = progress.get(key) ?? { busy: false, fails: 0, full: false };
      p.busy = true;
      progress.set(key, p);
      const failed = () => {
        p.busy = false;
        p.fails++;
        if (p.fails < TRIES) window.setTimeout(() => setRetry((n) => n + 1), RETRY_MS);
      };
      const show = (strokes: Drawing) => setDrawings((all) => ({ ...all, [key]: strokes }));
      void (async () => {
        // The quick sketch first, unless one is already showing.
        if (!drawings[key]) {
          const quick = await aiDraw(key, "quick");
          if (!quick.ok || !quick.data.strokes) return failed();
          show(quick.data.strokes);
        }
        const full = await aiDraw(key, "full");
        if (!full.ok || !full.data.strokes) {
          // The quick sketch is on screen; keep it rather than pay for more slow attempts.
          p.busy = false;
          p.fails = TRIES;
          return;
        }
        p.busy = false;
        p.full = true;
        show(full.data.strokes);
        save(key, full.data.strokes);
      })();
    }
    // `drawings` is read only to skip a quick sketch already on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want, retry]);

  return drawings;
}
