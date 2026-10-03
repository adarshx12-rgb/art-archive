import { withArticle } from "../sketch/layers";
import type { Glyph } from "../sketch/parse";
import { byPriority, type Projected } from "./camera";
import { FIGURES, isImage, isSky, isText, widthRatio } from "./model";
import { describeRig, mirrorRig } from "./rig";

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

/** Only a clear stretch is worth a word; small ones would just add noise. */
function shape(p: Projected): string {
  if (isText(p.glyph) || isImage(p.glyph) || !p.stretch) return "";
  if (p.stretch >= 1.4) return "wide and squat";
  if (p.stretch <= 0.7) return "tall and narrow";
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
  const w = (h * widthRatio(p.glyph, p.label, p.image?.ratio) * (p.stretch ?? 1) * p.count) / aspect;
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
        shape(p),
        p.rig ? describeRig(p.flip ? mirrorRig(p.rig) : p.rig) : POSE_WORDS[p.pose ?? "stand"] && !/\b(walk|run|sit|danc|ly|lie)/i.test(p.label) ? POSE_WORDS[p.pose ?? "stand"] : "",
        facing(p),
        tilt(p),
        hiddenBy(p, nearer, aspect),
      ].filter(Boolean);
      return `${parts.join(", ")}${i === 0 && grounded[0] === p ? " (the main subject)" : ""}`;
    })
    .join("; ");
}

/** The subject drawn on top at a point of the frame, if any. Projected subjects come furthest first, the order they're drawn in. */
export function subjectAt(x: number, y: number, projected: Projected[], aspect: number): Projected | undefined {
  return [...projected]
    .filter((p) => p.outside < 0.5)
    .reverse()
    .find((p) => {
      const b = box(p, aspect);
      return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
    });
}

/** What a point of the frame lands on: the nearest subject covering it, or else the part of the frame. */
function pointAt(x: number, y: number, projected: Projected[], aspect: number): string {
  const hit = subjectAt(x, y, projected, aspect);
  if (hit) return isText(hit.glyph) ? `the text "${hit.label}"` : isImage(hit.glyph) ? hit.label : `the ${hit.label.replace(/^(a|an|the|one)\s+/i, "")}`;
  const h = x < 0.34 ? "left" : x > 0.66 ? "right" : "";
  const v = y < 0.34 ? "upper" : y > 0.66 ? "lower" : "";
  return h && v ? `the ${v} ${h} of the frame` : h ? `the ${h} of the frame` : v ? `the ${v} centre of the frame` : "the centre of the frame";
}

/** Comments pinned to the preview, numbered: "1) the boat: make it an old pirate ship". */
export function describeComments(comments: { x: number; y: number; text: string }[], projected: Projected[], aspect: number): string[] {
  return comments.map((c, i) => `${i + 1}) ${pointAt(c.x, c.y, projected, aspect)}: ${c.text}`);
}

/** What an added picture sits on, if anything, and whether that's a figure's head. */
function imageTarget(img: Projected, projected: Projected[], aspect: number): { on?: Projected; head: boolean } {
  const others = projected.filter((p) => !isImage(p.glyph) && !isText(p.glyph) && !isSky(p.glyph));
  const on = subjectAt(img.x, img.y, others, aspect);
  if (!on || !FIGURES.has(on.glyph)) return { on, head: false };
  // The top quarter of a figure is its head.
  const b = box(on, aspect);
  return { on, head: img.y <= b.y0 + 0.25 * (b.y1 - b.y0) };
}

const theName = (p: Projected) => `the ${p.label.replace(/^(a|an|the|one)\s+/i, "")}`;
const LIKENESS =
  "Keep the exact likeness: the same facial features, face shape, skin tone, hair and age; do not beautify, idealise, replace or stylise away the identity, and let only the lighting and the style's rendering adapt.";

/**
 * Instructions for the pictures added to the sketch, in the order to attach
 * them: an attach line, then one line each saying what to do with it. A
 * picture on a figure's head is that figure's face unless set otherwise.
 */
export function referenceImages(projected: Projected[], aspect: number): string[] {
  // In number order, the order they're attached in.
  const num = (p: Projected) => Number(p.label.match(/\d+/)?.[0] ?? Infinity);
  const images = projected.filter((p) => isImage(p.glyph)).sort((a, b) => num(a) - num(b));
  if (!images.length) return [];
  const nums = images.map((p) => p.label.match(/\d+/)?.[0] ?? p.label);
  const list = nums.length === 1 ? nums[0] : `${nums.slice(0, -1).join(", ")} and ${nums.at(-1)}`;
  const lines = [nums.length === 1 ? `Attach image ${list} with this prompt.` : `Attach images ${list} with this prompt, in this order.`];
  images.forEach((img, i) => {
    const name = `Image ${nums[i]}`;
    const { on, head } = imageTarget(img, projected, aspect);
    const place = on ? `on ${theName(on)}` : where(img);
    const use = img.image?.use ?? (head ? "face" : undefined);
    if (use === "face") lines.push(on && FIGURES.has(on.glyph) ? `${name}: ${theName(on)}'s face. ${LIKENESS}` : `${name}: a face, ${where(img)}. ${LIKENESS}`);
    else if (use === "logo")
      lines.push(`${name}: a logo or symbol ${place}. Reproduce it exactly, with the same shapes, letters, colours and proportions; do not redraw, restyle, simplify or add to it, and blend it in by matching the scene's lighting, perspective and surface.`);
    else if (use === "product")
      lines.push(on ? `${name}: ${theName(on)}, exactly as it appears in the image, with the same shape, details, labels and colours.` : `${name}: a product or object, exactly as it appears, with the same shape, details, labels and colours, ${where(img)}.`);
    else if (use === "look") lines.push(`${name}: use only its look (colours, mood, texture); do not copy what it shows.`);
    else lines.push(`${name}: include exactly what it shows, ${place}.`);
  });
  return lines;
}
