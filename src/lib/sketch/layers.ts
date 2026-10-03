import { parseSubject, type Glyph, type Pose, type SketchItem } from "./parse";
import type { ActorImage } from "../scene/model";
import type { Rig } from "../scene/rig";

/**
 * Subjects the user places on the sketch by hand. Position is the centre of
 * the subject as a fraction of the frame (like an After Effects anchor
 * point at the centre); scale 1 is the subject's natural size.
 */
export interface Layer {
  id: string;
  glyph: Glyph;
  /** What the user calls it, e.g. "old fisherman". */
  label: string;
  x: number;
  y: number;
  scale: number;
  /** Width as a multiple of the natural width; unset is 1. */
  stretch?: number;
  /** Degrees, clockwise. May go past 360 (shown as turns + degrees). */
  rotation: number;
  flip: boolean;
  /** The word in the subject text this layer stands for, so the auto-sketch doesn't draw it twice. */
  from?: string;
  /** How many are drawn side by side ("two dogs"). */
  count: number;
  /** Set when the layer is a projection of a 3D subject. */
  pose?: Pose;
  facing?: "front" | "back" | "left" | "right";
  /** For an added picture: which stored image, and its width / height. */
  image?: ActorImage;
  /** For a figure posed with the puppet tool: its skeleton. */
  rig?: Rig;
}

export const MAX_LAYERS = 12;
export const LABEL_MAX = 80;

/** Menu of subjects that can be added, grouped for the picker. */
export const LAYER_TYPES: { group: string; items: { glyph: Glyph; label: string }[] }[] = [
  { group: "People", items: [{ glyph: "person", label: "person" }, { glyph: "child", label: "child" }, { glyph: "robot", label: "robot" }] },
  { group: "Animals", items: [{ glyph: "animal", label: "dog" }, { glyph: "animal", label: "cat" }, { glyph: "big-animal", label: "horse" }, { glyph: "bird", label: "bird" }, { glyph: "fish", label: "fish" }] },
  { group: "Vehicles", items: [{ glyph: "car", label: "car" }, { glyph: "bike", label: "bicycle" }, { glyph: "boat", label: "boat" }, { glyph: "train", label: "train" }, { glyph: "plane", label: "plane" }] },
  { group: "Places", items: [{ glyph: "house", label: "house" }, { glyph: "tower", label: "tower" }, { glyph: "lighthouse", label: "lighthouse" }, { glyph: "castle", label: "castle" }, { glyph: "city", label: "city" }, { glyph: "door", label: "door" }, { glyph: "window", label: "window" }] },
  { group: "Nature", items: [{ glyph: "tree", label: "tree" }, { glyph: "palm", label: "palm tree" }, { glyph: "flower", label: "flower" }, { glyph: "mountain", label: "mountain" }, { glyph: "hill", label: "hill" }] },
  { group: "Sky", items: [{ glyph: "sun", label: "sun" }, { glyph: "moon", label: "moon" }, { glyph: "planet", label: "planet" }, { glyph: "cloud", label: "cloud" }, { glyph: "star", label: "star" }] },
  { group: "Objects", items: [{ glyph: "table", label: "table" }, { glyph: "chair", label: "chair" }, { glyph: "bed", label: "bed" }, { glyph: "lamp", label: "lamp" }, { glyph: "book", label: "book" }, { glyph: "cup", label: "cup" }, { glyph: "candle", label: "candle" }, { glyph: "sword", label: "sword" }, { glyph: "guitar", label: "guitar" }, { glyph: "device", label: "phone" }, { glyph: "bottle", label: "bottle" }] },
];

const GLYPHS = new Set<Glyph>([...LAYER_TYPES.flatMap((g) => g.items.map((i) => i.glyph)), "thing"]);

/** Natural height of each subject at scale 1, as a fraction of the frame height. */
export const LAYER_HEIGHT: Record<Glyph, number> = {
  person: 0.45, child: 0.3, robot: 0.45, animal: 0.16, "big-animal": 0.35, bird: 0.05, fish: 0.1,
  car: 0.2, bike: 0.2, boat: 0.3, train: 0.22, plane: 0.08,
  house: 0.3, tower: 0.45, lighthouse: 0.5, castle: 0.35, city: 0.35, window: 0.2, door: 0.3,
  tree: 0.35, palm: 0.4, flower: 0.1, mountain: 0.35, hill: 0.12,
  sun: 0.16, moon: 0.14, star: 0.06, planet: 0.14, cloud: 0.1,
  table: 0.18, chair: 0.22, bed: 0.16, lamp: 0.26, book: 0.06, cup: 0.06, candle: 0.1, sword: 0.25, guitar: 0.22, device: 0.06, bottle: 0.08,
  thing: 0.2,
  text: 0.08,
  image: 0.35,
};

/** Width relative to height, for the selection box. */
export const LAYER_ASPECT: Record<Glyph, number> = {
  person: 0.5, child: 0.5, robot: 0.5, animal: 1.6, "big-animal": 1.6, bird: 2.5, fish: 2.4,
  car: 2.5, bike: 1.3, boat: 1.3, train: 4.8, plane: 1.3,
  house: 1, tower: 0.4, lighthouse: 0.75, castle: 1.35, city: 1.9, window: 0.6, door: 0.5,
  tree: 0.65, palm: 1, flower: 0.4, mountain: 2.3, hill: 5,
  sun: 1, moon: 0.8, star: 1, planet: 1.8, cloud: 2.2,
  table: 1.4, chair: 0.7, bed: 2.6, lamp: 0.45, book: 1.2, cup: 1, candle: 0.45, sword: 0.35, guitar: 0.75, device: 0.9, bottle: 0.45,
  thing: 1.2,
  text: 1,
  image: 1,
};

/** Width relative to height; text is as wide as its words (mono letters are about 0.6 em), an image as wide as its crop. */
export const layerAspect = (glyph: Glyph, label: string, ratio?: number) =>
  glyph === "text" ? Math.max(1, 0.62 * label.length) : glyph === "image" ? (ratio ?? 1) : LAYER_ASPECT[glyph];

const SKY = new Set<Glyph>(["sun", "moon", "star", "planet", "cloud", "bird", "plane"]);
const BACK = new Set<Glyph>(["house", "tower", "lighthouse", "castle", "city", "window", "door", "tree", "palm", "mountain", "hill"]);

/** Where a new subject lands: people and objects in front, places along the horizon, sky up top. */
export function newLayer(glyph: Glyph, label: string, existing: Layer[], from?: string, count = 1): Layer {
  const n = existing.length;
  const offset = n === 0 ? 0 : (n % 2 ? -1 : 1) * 0.12 * Math.ceil(n / 2);
  const y = SKY.has(glyph) ? 0.2 : BACK.has(glyph) ? 0.42 : 0.66;
  return {
    id: `${glyph}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    glyph,
    label: cleanLabel(label) || glyph,
    x: Math.min(Math.max(0.5 + offset, 0.08), 0.92),
    y,
    scale: 1,
    rotation: 0,
    flip: false,
    count: clamp(Math.round(count), 1, 6),
    ...(from ? { from } : {}),
  };
}

/** Which recognised thing a typed subject is mainly about: people and animals first, then objects, places, sky. */
const PICK_ORDER: Glyph[] = ["person", "child", "robot", "big-animal", "animal", "bird", "fish", "car", "bike", "boat", "train", "plane"];
function mainItem(items: SketchItem[]): SketchItem | undefined {
  return (
    PICK_ORDER.map((g) => items.find((i) => i.glyph === g)).find(Boolean) ??
    items.find((i) => i.layer === "front") ??
    items.find((i) => i.layer === "back") ??
    items[0]
  );
}

/** A layer for whatever the user typed: "two old dogs" draws two dogs and keeps the full wording. */
export function layerFromText(text: string, existing: Layer[]): Layer | null {
  const label = cleanLabel(text);
  if (!label) return null;
  const item = mainItem(parseSubject(label).items);
  return newLayer(item?.glyph ?? "thing", label, existing, undefined, item?.count ?? 1);
}

export const cleanLabel = (s: string) => s.replace(/[~|\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim().slice(0, LABEL_MAX);

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Compact form for share links: glyph~label~x~y~scale~rotation~flip~from~count, joined with "|". */
export function encodeLayers(layers: Layer[]): string {
  return layers
    .map((l) => [l.glyph, l.label, round(l.x, 3), round(l.y, 3), round(l.scale, 2), round(l.rotation, 1), l.flip ? 1 : 0, l.from ?? "", l.count].join("~"))
    .join("|");
}

export function decodeLayers(raw: string): { layers: Layer[]; bad: boolean } {
  let bad = false;
  const layers: Layer[] = [];
  raw.split("|").filter(Boolean).slice(0, MAX_LAYERS).forEach((part, i) => {
    const [glyph, label, x, y, scale, rotation, flip, from, count] = part.split("~");
    const nums = [x, y, scale, rotation].map(Number);
    if (!GLYPHS.has(glyph as Glyph) || nums.some((v) => !Number.isFinite(v))) {
      bad = true;
      return;
    }
    layers.push({
      id: `${glyph}-${i}`,
      glyph: glyph as Glyph,
      label: cleanLabel(label ?? "") || (glyph as string),
      x: clamp(nums[0]!, -0.2, 1.2),
      y: clamp(nums[1]!, -0.2, 1.2),
      scale: clamp(nums[2]!, 0.05, 8),
      rotation: clamp(nums[3]!, -3600, 3600),
      flip: flip === "1",
      count: clamp(Math.round(Number(count) || 1), 1, 6),
      ...(from ? { from: cleanLabel(from) } : {}),
    });
  });
  return { layers, bad };
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

/** "a woman", or the label as typed when it already has an article or number. */
export function withArticle(label: string): string {
  return /^(a|an|the|one|two|three|four|five|six|my|his|her|their|\d+)\b/i.test(label) ? label : `${article(label)} ${label}`;
}

/** Plain-language placement for the prompt, e.g. "a woman large in the lower left, tilted". */
export function describeLayer(l: Layer): string {
  const h = l.x < 0.34 ? "left" : l.x > 0.66 ? "right" : "";
  const v = l.y < 0.34 ? "upper" : l.y > 0.66 ? "lower" : "";
  const where = h && v ? `in the ${v} ${h}` : h ? `on the ${h}` : v ? `in the ${v} centre` : "in the centre";
  const size = LAYER_HEIGHT[l.glyph] * l.scale;
  const big = size > 0.6 ? "filling much of the frame, close to camera" : size < 0.08 ? "small and far away" : "";
  const turn = ((Math.abs(l.rotation) % 360) + 360) % 360;
  const tilt = turn > 60 && turn < 300 ? (turn > 150 && turn < 210 ? "upside down" : "on its side") : turn > 12 && turn < 348 ? "tilted" : "";
  return [withArticle(l.label), where, big, tilt].filter(Boolean).join(", ");
}
