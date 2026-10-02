import { withArticle } from "../sketch/layers";
import type { Glyph } from "../sketch/parse";
import { byPriority, type Projected } from "./camera";
import { isSky, isText, widthRatio } from "./model";

/** Things that have a front, so which way they face is worth saying. */
const FACES = new Set<Glyph>(["person", "child", "robot", "animal", "big-animal", "bird", "fish", "car", "bike", "boat", "train", "plane"]);

const POSE_WORDS: Record<string, string> = { walk: "walking", run: "running", sit: "sitting", dance: "dancing", lie: "lying down" };

function where(p: Projected): string {
  if (p.outside > 0.15) return "just out of frame";
  const h = p.x < 0.34 ? "left" : p.x > 0.66 ? "right" : "";
  const v = p.y < 0.34 ? "upper" : p.y > 0.66 ? "lower" : "";
  if (isSky(p.glyph)) return `in the sky${h || v ? `, ${[v, h].filter(Boolean).join(" ")}` : ""}`;
  return h && v ? `in the ${v} ${h} of the frame` : h ? `on the ${h} of the frame` : v ? `in the ${v} centre of the frame` : "in the centre of the frame";
}

function size(p: Projected): string {
  if (isSky(p.glyph)) return "";
  const close = p.depth < 2.5 ? ", close to camera" : "";
  if (p.size > 1.6) return `in extreme close-up, larger than the frame${close}`;
  if (p.size > 0.95) return `filling the frame${close}`;
  if (p.size > 0.55) return `large in frame${close}`;
  if (p.size < 0.06) return "tiny in the distance";
  if (p.size < 0.15) return "small in the distance";
  return "";
}

function facing(p: Projected): string {
  if (!FACES.has(p.glyph)) return "";
  switch (p.facing) {
    case "front":
      return "facing the camera";
    case "back":
      return "seen from behind";
    case "left":
      return "in profile, facing left";
    case "right":
      return "in profile, facing right";
  }
}

function tilt(p: Projected): string {
  const lean = ((p.actor.rotation[0] % 360) + 360) % 360;
  const roll = ((p.actor.rotation[2] % 360) + 360) % 360;
  const bent = (a: number) => a > 15 && a < 345;
  if (roll > 150 && roll < 210) return "upside down";
  if ((roll > 60 && roll < 300) || (lean > 60 && lean < 300)) return "on its side";
  if (bent(lean)) return lean < 180 ? "leaning forward" : "leaning back";
  if (bent(roll)) return "tilted";
  return "";
}

/** Approximate on-screen box, as fractions of the frame. */
function box(p: Projected, aspect: number) {
  const h = p.size;
  const w = (h * widthRatio(p.glyph, p.label) * p.count) / aspect;
  return { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - h / 2, y1: p.y + h / 2, area: w * h };
}

/** "partly hidden behind the knight" when a nearer subject covers a good part of this one. */
function hiddenBy(p: Projected, nearer: Projected[], aspect: number): string {
  const a = box(p, aspect);
  for (const q of nearer) {
    const b = box(q, aspect);
    const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
    const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    if (a.area > 0 && (ix * iy) / a.area > 0.3) return `partly hidden behind the ${q.label.replace(/^(a|an|the|one)\s+/i, "")}`;
  }
  return "";
}

/**
 * Plain-language blocking for the prompt, main subject first:
 * "a knight on the left of the frame, large in frame, facing the camera (the main subject); a castle ..."
 */
export function describeScene(projected: Projected[], aspect: number): string {
  const ordered = byPriority(projected);
  const grounded = ordered.filter((p) => !isSky(p.glyph) && !isText(p.glyph));
  const depthBand = (p: Projected) => {
    if (grounded.length < 2 || !grounded.includes(p)) return "";
    const near = grounded[0]!.depth;
    const far = grounded[grounded.length - 1]!.depth;
    if (far - near < 1.5) return "";
    const f = (p.depth - near) / (far - near);
    return f < 0.2 ? "in the foreground" : f > 0.8 ? "in the background" : "in the middle ground";
  };
  return ordered
    .map((p, i) => {
      const nearer = ordered.slice(0, i).filter((q) => q.depth < p.depth);
      const parts = [
        isText(p.glyph) ? `the text "${p.label}"` : withArticle(p.label),
        where(p),
        depthBand(p),
        size(p),
        POSE_WORDS[p.pose ?? "stand"] && !/\b(walk|run|sit|danc|ly|lie)/i.test(p.label) ? POSE_WORDS[p.pose ?? "stand"] : "",
        facing(p),
        tilt(p),
        hiddenBy(p, nearer, aspect),
      ].filter(Boolean);
      return `${parts.join(", ")}${i === 0 && grounded[0] === p ? " (the main subject)" : ""}`;
    })
    .join("; ");
}

/** What a point of the frame lands on: the nearest subject covering it, or else the part of the frame. */
function pointAt(x: number, y: number, projected: Projected[], aspect: number): string {
  const hit = [...projected]
    .filter((p) => p.outside < 0.5)
    .sort((a, b) => a.depth - b.depth)
    .find((p) => {
      const b = box(p, aspect);
      return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
    });
  if (hit) return isText(hit.glyph) ? `the text "${hit.label}"` : `the ${hit.label.replace(/^(a|an|the|one)\s+/i, "")}`;
  const h = x < 0.34 ? "left" : x > 0.66 ? "right" : "";
  const v = y < 0.34 ? "upper" : y > 0.66 ? "lower" : "";
  return h && v ? `the ${v} ${h} of the frame` : h ? `the ${h} of the frame` : v ? `the ${v} centre of the frame` : "the centre of the frame";
}

/** Comments pinned to the preview, numbered: "1) the boat: make it an old pirate ship". */
export function describeComments(comments: { x: number; y: number; text: string }[], projected: Projected[], aspect: number): string[] {
  return comments.map((c, i) => `${i + 1}) ${pointAt(c.x, c.y, projected, aspect)}: ${c.text}`);
}
