import { AI_DRAWN } from "../sketch/drawing";
import { decodeRig, encodeRig, type Rig } from "./rig";
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
  /** Width as a multiple of its natural width at this scale; unset is 1. `scale` alone sets the height. */
  stretch?: number;
  pose: Pose;
  /** Drawn side by side, e.g. "two dogs". */
  count: number;
  /** For an added picture: which stored image, and its width / height. */
  image?: ActorImage;
  /** For a figure posed with the puppet tool: its skeleton (lib/scene/rig.ts). Replaces the named pose. */
  rig?: Rig;
}

/** Subjects drawn as stick figures, which the puppet tool can pose. */
export const FIGURES = new Set<Glyph>(["person", "child", "robot"]);

/** What an added picture is for: a face to keep, a logo to reproduce, a product to show, or only its look. */
export type ImageUse = "face" | "logo" | "product" | "look";
export const IMAGE_USES: { id: ImageUse; label: string }[] = [
  { id: "face", label: "Face (keep likeness)" },
  { id: "logo", label: "Logo / symbol (exact)" },
  { id: "product", label: "Product / object (exact)" },
  { id: "look", label: "Look only" },
];

/** A picture kept in this browser (lib/images.ts) under key; ratio is its width / height after cropping. */
export interface ActorImage {
  key: string;
  ratio: number;
  /** Unset: worked out from where it sits (on a figure's head, it's that figure's face). */
  use?: ImageUse;
}

export const MAX_IMAGES = 4;

/** How far a subject can be stretched or squashed sideways. */
export const MIN_STRETCH = 0.1;
export const MAX_STRETCH = 10;

/** No practical limit on subjects; this only guards share links and the API against absurd sizes. */
export const MAX_ACTORS = 200;

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
  text: 0.4,
  image: 1.2,
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

/** Width relative to height for one subject; text is as wide as its words, an image as wide as its crop. */
export const widthRatio = (glyph: Glyph, label: string, ratio?: number) =>
  glyph === "text" ? Math.max(1, 0.62 * label.length) : glyph === "image" ? (ratio ?? 1) : (WIDTH_RATIO[glyph] ?? 1);

export const isText = (g: Glyph) => g === "text";
export const isImage = (g: Glyph) => g === "image";

const SKY = new Set<Glyph>(["sun", "moon", "star", "planet", "cloud"]);
const FLYING = new Set<Glyph>(["bird", "plane"]);
const BACKDROP = new Set<Glyph>(["house", "tower", "lighthouse", "castle", "city", "tree", "palm", "mountain", "hill"]);
const SMALL = new Set<Glyph>(["book", "cup", "candle", "device", "bottle", "sword", "guitar"]);
/** Built nose-first along +z; start them side-on to the camera, facing right. */
const SIDE_ON = new Set<Glyph>(["animal", "big-animal", "fish", "car", "bike", "boat", "train", "plane"]);

export const isSky = (g: Glyph) => SKY.has(g);

const GLYPHS = new Set<Glyph>([...LAYER_TYPES.flatMap((g) => g.items.map((i) => i.glyph)), "thing", "text", "image"]);

/** Where a new subject lands: people in front of the camera, backdrops behind, sky far away. */
export function newActor(glyph: Glyph, label: string, existing: Actor[], count = 1, pose: Pose = "stand"): Actor {
  const n = existing.length;
  const side = n === 0 ? 0 : (n % 2 ? -1 : 1) * Math.ceil(n / 2);
  let position: Vec3;
  if (SKY.has(glyph)) position = [side * 80 + 120, 120, -600];
  else if (FLYING.has(glyph)) position = [side * 2 + 1, glyph === "plane" ? 40 : 4, -12];
  else if (BACKDROP.has(glyph)) position = [side * REAL_HEIGHT[glyph] * 0.8, 0, -Math.max(REAL_HEIGHT[glyph] * 3, 20)];
  else if (SMALL.has(glyph)) position = [side * 0.4 + 0.3, 0.75, 0];
  // Text floats above the subjects, like a title or a sign.
  else if (glyph === "text") position = [side * 0.5, 2.1, 0];
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

/** Words to letter into the image, placed on the sketch as they are written. */
export function textActor(text: string, existing: Actor[]): Actor | null {
  return cleanLabel(text) ? newActor("text", text, existing) : null;
}

/** Words that end the subject's own name: "chair by the window", "glass of wine". */
const CONNECTORS = new Set(["in", "on", "with", "by", "under", "over", "at", "of", "near", "beside", "behind", "above", "below", "from", "inside", "through", "against", "for", "into", "onto", "holding", "wearing"]);

/** The noun the subject is named by, singular: "glass and steel truss" -> "truss". */
function headNoun(label: string): string | undefined {
  const words = label.toLowerCase().split(/[^a-z0-9àâäéèêëïîôöùûüç]+/).filter(Boolean);
  const cut = words.findIndex((w) => CONNECTORS.has(w));
  const name = (cut > 0 ? words.slice(0, cut) : words).filter((w) => !w.endsWith("ing"));
  const last = name.at(-1);
  // The word list draws "palm trees" as palms.
  if ((last === "tree" || last === "trees") && name.at(-2) === "palm") return "palm";
  return last && (parseSubject(last).items[0]?.label ?? last);
}

/** An added picture, standing in front of the camera like a subject, numbered "image 1", "image 2"… */
export function imageActor(image: ActorImage, existing: Actor[]): Actor {
  const taken = new Set(existing.filter((a) => a.glyph === "image").map((a) => a.label));
  let n = 1;
  while (taken.has(`image ${n}`)) n++;
  return { ...newActor("image", `image ${n}`, existing), image };
}

/** A subject for whatever the user typed: "two old dogs running" draws two running dogs and keeps the wording. */
export function actorFromText(text: string, existing: Actor[]): Actor | null {
  const label = cleanLabel(text);
  if (!label) return null;
  const parsed = parseSubject(label);
  // A built-in shape only when it's what the subject is: people, animals and vehicles, or the subject's own noun.
  // "glass and steel truss" isn't a cup, and a laptop deserves better than the generic device box: both get an AI drawing.
  const head = headNoun(label);
  const fits = parsed.items.filter((i) => (PICK_ORDER.includes(i.glyph) || i.label === head) && !AI_DRAWN.has(i.glyph));
  const item = mainItem(fits);
  return newActor(item?.glyph ?? "thing", label, existing, item?.count ?? 1, parsed.pose);
}

// ——— Share links ———

const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** glyph~label~x~y~z~rx~ry~rz~scale~pose~count (scale is "height" or "heightxstretch"), plus ~key~ratio for images or ~rig for posed figures, joined with "|". */
export function encodeActors(actors: Actor[]): string {
  return actors
    .map((a) => [a.glyph, a.label, ...a.position.map((v) => r(v)), ...a.rotation.map((v) => r(v, 1)), a.stretch ? `${r(a.scale)}x${r(a.stretch)}` : r(a.scale), a.pose, a.count, ...(a.image ? [a.image.key, r(a.image.ratio, 3), ...(a.image.use ? [a.image.use] : [])] : a.rig && FIGURES.has(a.glyph) ? [encodeRig(a.rig)] : [])].join("~"))
    .join("|");
}

export function decodeActors(raw: string): { actors: Actor[]; bad: boolean } {
  let bad = false;
  const actors: Actor[] = [];
  raw.split("|").filter(Boolean).slice(0, MAX_ACTORS).forEach((part, i) => {
    const [glyph, label, ...rest] = part.split("~");
    // The scale field may carry a width stretch: "1.2x0.6".
    const [height, stretch] = (rest[6] ?? "").split("x");
    const nums = [...rest.slice(0, 6), height].map(Number);
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
      ...(stretch !== undefined && Number.isFinite(Number(stretch)) && Number(stretch) > 0 && Number(stretch) !== 1 ? { stretch: clamp(Number(stretch), MIN_STRETCH, MAX_STRETCH) } : {}),
      pose: POSE_IDS.has(pose) ? pose : "stand",
      count: clamp(Math.round(Number(rest[8]) || 1), 1, 6),
      // The picture itself stays in the browser that added it; a link carries only its key and shape.
      ...(FIGURES.has(glyph as Glyph) && rest[9] && decodeRig(rest[9]) ? { rig: decodeRig(rest[9])! } : {}),
      ...(glyph === "image" ? { image: { key: (rest[9] ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 40), ratio: clamp(Number(rest[10]) > 0 ? Number(rest[10]) : 1, 0.1, 10), ...(IMAGE_USES.some((u) => u.id === rest[11]) ? { use: rest[11] as ImageUse } : {}) } } : {}),
    });
  });
  return { actors, bad };
}
