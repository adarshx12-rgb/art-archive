/**
 * Line drawings the AI makes for subjects the storyboard has no shape for
 * ("a laptop", "a steel truss"): an outline icon, a few dozen SVG paths in a
 * fixed box, checked here so only plain lines and curves ever reach the page.
 */

/** The drawing box, the same proportions as the placeholder it replaces. */
export const DRAW_W = 120;
export const DRAW_H = 100;
export const MAX_STROKES = 32;
const MAX_PATH = 1200;

/** One outline path; drawings are line icons, never filled. */
export interface Stroke {
  d: string;
}
export type Drawing = Stroke[];

/** How many numbers each command takes. Absolute commands only; no arcs. */
const ARGS: Record<string, number> = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };

const round = (n: number) => String(Math.round(n * 10) / 10);

/** A path rebuilt from its parts with every point inside the box, or null if it isn't a plain M/L/Q/C/Z path. */
export function cleanPath(d: string): string | null {
  if (!d || d.length > MAX_PATH || !/^[MLQCZ0-9.,\s-]+$/.test(d)) return null;
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g);
  if (!tokens || tokens[0] !== "M") return null;
  let out = "";
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++]!;
    const n = ARGS[cmd];
    if (n === undefined) return null;
    const nums = tokens.slice(i, i + n).map(Number);
    if (nums.length !== n || nums.some((v) => !Number.isFinite(v))) return null;
    i += n;
    // Points are x, y pairs.
    const pts = nums.map((v, k) => round(Math.min(Math.max(v, 0), k % 2 ? DRAW_H : DRAW_W)));
    out += cmd + pts.join(" ");
    // Repeated pairs after a command ("L1 2 3 4") aren't allowed: the next token must be a command.
    if (i < tokens.length && ARGS[tokens[i]!] === undefined) return null;
  }
  return out;
}

/** Keeps the strokes that pass, at most MAX_STROKES; null when none do. */
export function cleanDrawing(strokes: { d: string }[]): Drawing | null {
  const out: Drawing = [];
  for (const s of strokes) {
    const d = typeof s?.d === "string" ? cleanPath(s.d) : null;
    if (d) out.push({ d });
    if (out.length === MAX_STROKES) break;
  }
  return out.length ? out : null;
}

/** Built-in shapes too generic to read ("device" is one rectangle for a phone, a laptop and a TV): these get an AI icon instead. */
export const AI_DRAWN = new Set(["thing", "device"]);

/** One drawing per subject, whatever the spacing or capitals. */
export const drawingKey = (label: string) => label.toLowerCase().replace(/\s+/g, " ").trim();
