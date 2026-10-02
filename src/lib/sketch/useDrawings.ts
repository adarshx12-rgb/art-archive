import { useEffect, useState } from "react";
import { aiDraw } from "../ai";
import { cleanDrawing, drawingKey, type Drawing } from "./drawing";

/**
 * AI line drawings for the subjects the sketch has no shape for, keyed by
 * drawingKey(label). Each subject is asked for once; finished drawings are
 * kept in this browser so a reload or a shared link doesn't pay again.
 * While one loads, or if it fails, the sketch keeps its placeholder box.
 */

// v2: outline icons. Older, filled drawings are left behind and redrawn.
const STORE = "ff-drawings-v2";
const KEEP = 60;

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

function save(all: Record<string, Drawing>) {
  try {
    // Newest last; drop the oldest beyond KEEP.
    const entries = Object.entries(all).slice(-KEEP);
    globalThis.localStorage?.setItem(STORE, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Storage full or blocked: drawings just won't survive a reload.
  }
}

/** Asked this session, so a failure isn't retried on every render. */
const asked = new Set<string>();

export function useDrawings(labels: string[]): Record<string, Drawing> {
  const [drawings, setDrawings] = useState(load);
  const wanted = [...new Set(labels.map(drawingKey).filter(Boolean))].filter((k) => !drawings[k] && !asked.has(k));
  const need = wanted.join("\n");

  useEffect(() => {
    if (!need) return;
    for (const key of need.split("\n")) {
      asked.add(key);
      void aiDraw(key).then((res) => {
        if (!res.ok || !res.data.strokes) return;
        const strokes = res.data.strokes;
        setDrawings((all) => {
          const next = { ...all, [key]: strokes };
          save(next);
          return next;
        });
      });
    }
  }, [need]);

  return drawings;
}
