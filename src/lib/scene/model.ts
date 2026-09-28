import { cleanLabel, clamp, LAYER_TYPES } from "../sketch/layers";
import { parseSubject, type Glyph, type Pose, type SketchItem } from "../sketch/parse";

/**
 * The 3D scene behind the builder's previews. Units are metres; y is up,
 * the ground is y = 0, and the default camera looks along -z. Both the 3D
 * view and the flat storyboard are drawn from this one scene.
 */
export type Vec3 = [number, number, number];

export interface Actor {
  id: string;
  glyph: Glyph;
  /** What the user calls it, e.g. "old fisherman in a yellow coat". */
  label: string;
  /** Feet / base position in metres. */
  position: Vec3;
  /** Degrees about x (lean), y (turn) and z (roll). Turn 0 faces the camera. */
  rotation: Vec3;
  scale: number;
  pose: Pose;
  /** Drawn side by side, e.g. "two dogs". */
  count: number;
}

export const MAX_ACTORS = 12;

export const POSES: { id: Pose; label: string }[] = [
  { id: "stand", label: "Standing" },
  { id: "walk", label: "Walking" },
  { id: "run", label: "Running" },
  { id: "sit", label: "Sitting" },
  { id: "dance", label: "Dancing" },
  { id: "lie", label: "Lying" },
];
const POSE_IDS = new Set<Pose>(POSES.map((p) => p.id));

/** Real-world height in metres at scale 1. */
export const REAL_HEIGHT: Record<Glyph, number> = {
  person: 1.75, child: 1.2, robot: 1.8, animal: 0.6, "big-animal": 1.7, bird: 0.3, fish: 0.5,
  car: 1.5, bike: 1.1, boat: 3, train: 3.5, plane: 3,
  house: 6, tower: 20, lighthouse: 24, castle: 18, city: 40, window: 1.5, door: 2.2,
  tree: 6, palm: 8, flower: 0.45, mountain: 300, hill: 30,
  sun: 60, moon: 50, star: 8, planet: 60, cloud: 20,
  table: 0.75, chair: 1, bed: 0.6, lamp: 1.6, book: 0.25, cup: 0.12, candle: 0.25, sword: 1, guitar: 1, device: 0.16, bottle: 0.3,
  thing: 1,
};

/** Width relative to height (matches the 2D glyphs). */
export const WIDTH_RATIO: Partial<Record<Glyph, number>> = {
  person: 0.5, child: 0.5, robot: 0.5, animal: 1.6, "big-animal": 1.6, bird: 2.5, fish: 2.4,
  car: 2.6, bike: 1.5, boat: 1.4, train: 5, plane: 1.4,
  house: 1, tower: 0.4, lighthouse: 0.5, castle: 1.4, city: 2, window: 0.6, door: 0.5,
  tree: 0.65, palm: 0.8, flower: 0.4, mountain: 2.4, hill: 5,
  sun: 1, moon: 1, star: 1, planet: 1.8, cloud: 2.2,
  table: 1.8, chair: 0.5, bed: 3.3, lamp: 0.3, book: 0.8, cup: 0.8, candle: 0.3, sword: 0.2, guitar: 0.4, device: 0.5, bottle: 0.3,
  thing: 1,
};

const SKY = new Set<Glyph>(["sun", "moon", "star", "planet", "cloud"]);
const FLYING = new Set<Glyph>(["bird", "plane"]);
const BACKDROP = new Set<Glyph>(["house", "tower", "lighthouse", "castle", "city", "tree", "palm", "mountain", "hill"]);
const SMALL = new Set<Glyph>(["book", "cup", "candle", "device", "bottle", "sword", "guitar"]);
/** Built nose-first along +z; start them side-on to the camera, facing right. */
const SIDE_ON = new Set<Glyph>(["animal", "big-animal", "fish", "car", "bike", "boat", "train", "plane"]);

export const isSky = (g: Glyph) => SKY.has(g);

const GLYPHS = new Set<Glyph>([...LAYER_TYPES.flatMap((g) => g.items.map((i) => i.glyph)), "thing"]);

/** Where a new subject lands: people in front of the camera, backdrops behind, sky far away. */
export function newActor(glyph: Glyph, label: string, existing: Actor[], count = 1, pose: Pose = "stand"): Actor {
  const n = existing.length;
  const side = n === 0 ? 0 : (n % 2 ? -1 : 1) * Math.ceil(n / 2);
  let position: Vec3;
  if (SKY.has(glyph)) position = [side * 80 + 120, 120, -600];
  else if (FLYING.has(glyph)) position = [side * 2 + 1, glyph === "plane" ? 40 : 4, -12];
  else if (BACKDROP.has(glyph)) position = [side * REAL_HEIGHT[glyph] * 0.8, 0, -Math.max(REAL_HEIGHT[glyph] * 3, 20)];
  else if (SMALL.has(glyph)) position = [side * 0.4 + 0.3, 0.75, 0];
  else position = [side * 1.2, 0, 0];
  return {
    id: `${glyph}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    glyph,
    label: cleanLabel(label) || glyph,
    position,
    rotation: [0, SIDE_ON.has(glyph) ? 90 : 0, 0],
    scale: 1,
    pose,
    count: clamp(Math.round(count), 1, 6),
  };
}

/** Which recognised thing a typed subject is mainly about: people and animals first. */
const PICK_ORDER: Glyph[] = ["person", "child", "robot", "big-animal", "animal", "bird", "fish", "car", "bike", "boat", "train", "plane"];
function mainItem(items: SketchItem[]): SketchItem | undefined {
  return PICK_ORDER.map((g) => items.find((i) => i.glyph === g)).find(Boolean) ?? items.find((i) => i.layer === "front") ?? items.find((i) => i.layer === "back") ?? items[0];
}

/** A subject for whatever the user typed: "two old dogs running" draws two running dogs and keeps the wording. */
export function actorFromText(text: string, existing: Actor[]): Actor | null {
  const label = cleanLabel(text);
  if (!label) return null;
  const parsed = parseSubject(label);
  const item = mainItem(parsed.items);
  return newActor(item?.glyph ?? "thing", label, existing, item?.count ?? 1, parsed.pose);
}

// ——— Share links ———

const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** glyph~label~x~y~z~rx~ry~rz~scale~pose~count, joined with "|". */
export function encodeActors(actors: Actor[]): string {
  return actors
    .map((a) => [a.glyph, a.label, ...a.position.map((v) => r(v)), ...a.rotation.map((v) => r(v, 1)), r(a.scale), a.pose, a.count].join("~"))
    .join("|");
}

export function decodeActors(raw: string): { actors: Actor[]; bad: boolean } {
  let bad = false;
  const actors: Actor[] = [];
  raw.split("|").filter(Boolean).slice(0, MAX_ACTORS).forEach((part, i) => {
    const [glyph, label, ...rest] = part.split("~");
    const nums = rest.slice(0, 7).map(Number);
    const pose = rest[7] as Pose;
    if (!GLYPHS.has(glyph as Glyph) || nums.length < 7 || nums.some((v) => !Number.isFinite(v))) {
      bad = true;
      return;
    }
    const [x, y, z, rx, ry, rz, scale] = nums as [number, number, number, number, number, number, number];
    actors.push({
      id: `${glyph}-${i}`,
      glyph: glyph as Glyph,
      label: cleanLabel(label ?? "") || (glyph as string),
      position: [clamp(x, -5000, 5000), clamp(y, -100, 5000), clamp(z, -5000, 5000)],
      rotation: [clamp(rx, -3600, 3600), clamp(ry, -3600, 3600), clamp(rz, -3600, 3600)],
      scale: clamp(scale, 0.05, 20),
      pose: POSE_IDS.has(pose) ? pose : "stand",
      count: clamp(Math.round(Number(rest[8]) || 1), 1, 6),
    });
  });
  return { actors, bad };
}
