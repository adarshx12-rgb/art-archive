import type { BuilderState } from "../prompt/state";
import { LAYER_HEIGHT, type Layer } from "../sketch/layers";
import { isSky, isText, REAL_HEIGHT, type Actor, type Vec3 } from "./model";

/**
 * The shot camera: where the Camera presets put the lens, turned and
 * panned by the view you drag to in the preview. It is fixed to the set
 * (looking at the world origin), not to the subjects, so moving a subject
 * moves it through the frame, like blocking actors on a real set.
 *
 * The 2D board uses the same lens, straight on and without looking around,
 * so the picture keeps its composition; there, subjects only move within
 * the picture and never nearer or further.
 */
export interface ShotCamera {
  /** The 2D board: straight on, no looking around. */
  flat: boolean;
  /** Metres the frame covers vertically at the subject. */
  cover: number;
  /** Degrees above (+) or below (-) level the camera looks down from. */
  pitch: number;
  eye: Vec3;
  target: Vec3;
  /** Degrees; the Dutch tilt. */
  roll: number;
  /** Vertical field of view in degrees. */
  fov: number;
  /** Frame width / height. */
  aspect: number;
  focal: number;
  /** Camera basis, derived. */
  right: Vec3;
  up: Vec3;
  forward: Vec3;
}

/** Metres of the scene the frame covers vertically at the subject, per shot size, and the height the lens aims at. */
const SHOT: Record<string, { cover: number; aim: number }> = {
  "extreme-wide": { cover: 22, aim: 1.6 },
  wide: { cover: 7, aim: 1.2 },
  full: { cover: 2.3, aim: 0.95 },
  medium: { cover: 1.15, aim: 1.25 },
  "close-up": { cover: 0.5, aim: 1.55 },
  "extreme-close-up": { cover: 0.22, aim: 1.6 },
};

const FOCAL: Record<string, number> = { auto: 35, "14": 14, "24": 24, "35": 35, "50": 50, "85": 85, "135": 135 };

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(...a) || 1));
const rad = (d: number) => (d * Math.PI) / 180;

export function aspectOf(aspect: string): number {
  const [w, h] = aspect.split(":").map(Number);
  return (w || 4) / (h || 5);
}

/** How far each Angle preset looks down (degrees). */
const PITCH: Record<string, number> = { eye: 0, low: -14, high: 32, overhead: 89.5, dutch: 0 };

export type CameraState = Pick<BuilderState, "shot" | "angle" | "lens" | "composition" | "aspect" | "view" | "orbit">;

export function shotCamera(state: CameraState): ShotCamera {
  const focal = FOCAL[state.lens] ?? 35;
  const fov = 2 * Math.atan(12 / focal) * (180 / Math.PI); // 24mm-tall full-frame sensor
  const aspect = aspectOf(state.aspect);
  const { cover, aim } = SHOT[state.shot === "auto" ? "full" : state.shot] ?? SHOT.full!;
  const dist = cover / (2 * Math.tan(rad(fov) / 2));
  const angle = state.angle === "auto" ? "eye" : state.angle;
  const flat = state.view === "2d";
  const orbit = flat ? { yaw: 0, tilt: 0, panX: 0, panY: 0 } : state.orbit;

  // Rule of thirds: aim right of the subject so it sits on the left third line.
  const aimX = state.composition === "thirds" ? (cover * aspect) / 6 : 0;
  const pitch = flat ? 0 : Math.min(Math.max((PITCH[angle] ?? 0) + orbit.tilt, -35), 89.5);
  const yaw = rad(orbit.yaw);
  // Panning slides the camera sideways (relative to where it faces) and up/down.
  const sideways: Vec3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const target: Vec3 = add(add([aimX, aim, 0], mul(sideways, orbit.panX)), [0, orbit.panY, 0]);
  const back: Vec3 = [Math.sin(yaw) * Math.cos(rad(pitch)), Math.sin(rad(pitch)), Math.cos(yaw) * Math.cos(rad(pitch))];
  const eye = add(target, mul(back, dist));
  if (eye[1] < 0.05) eye[1] = 0.05; // never below the ground
  const roll = !flat && angle === "dutch" ? 12 : 0;

  const forward = norm(sub(target, eye));
  let right = norm(cross(forward, [0, 1, 0]));
  let up = cross(right, forward);
  if (roll) {
    const c = Math.cos(rad(roll));
    const s = Math.sin(rad(roll));
    const r2 = add(mul(right, c), mul(up, s));
    up = add(mul(up, c), mul(right, -s));
    right = r2;
  }
  return { flat, cover, pitch, eye, target, roll, fov, aspect, focal, right, up, forward };
}

/** The Angle wording that matches the view, after any turning and tilting in the preview. */
export function effectiveAngle(state: CameraState): BuilderState["angle"] {
  if (state.view === "2d" || state.orbit.tilt === 0) return state.angle;
  const pitch = shotCamera(state).pitch;
  if (state.angle === "dutch") return "dutch";
  return pitch >= 70 ? "overhead" : pitch >= 12 ? "high" : pitch <= -6 ? "low" : "eye";
}

/** Where the horizon crosses the frame (0 = top, 1 = bottom), or null when it's out of view. */
export function horizonAt(cam: ShotCamera): number | null {
  if (cam.flat) return null;
  const level = norm([cam.forward[0], 0, cam.forward[2]]);
  if (Math.hypot(cam.forward[0], cam.forward[2]) < 1e-3) return null;
  return project(cam, add(cam.eye, mul(level, 1e5))).y;
}

/** World point → frame position (0..1, y down) and distance along the lens. */
export function project(cam: ShotCamera, p: Vec3): { x: number; y: number; depth: number } {
  const v = sub(p, cam.eye);
  const depth = dot(v, cam.forward);
  const t = Math.tan(rad(cam.fov) / 2);
  const d = Math.max(depth, 1e-3);
  return { x: 0.5 + dot(v, cam.right) / (d * t * cam.aspect) / 2, y: 0.5 - dot(v, cam.up) / (d * t) / 2, depth };
}

/** The ray through a frame position. */
function rayAt(cam: ShotCamera, x: number, y: number): Vec3 {
  const t = Math.tan(rad(cam.fov) / 2);
  return norm(add(cam.forward, add(mul(cam.right, (x - 0.5) * 2 * t * cam.aspect), mul(cam.up, (0.5 - y) * 2 * t))));
}

/**
 * Frame position → world point on the horizontal plane at `height`, or at
 * `depth` along the lens when the plane is behind the camera or edge-on.
 */
export function unproject(cam: ShotCamera, x: number, y: number, height: number, depth: number): Vec3 {
  const dir = rayAt(cam, x, y);
  // The 2D board: stay at the same distance, so things never move nearer or further.
  if (cam.flat) return add(cam.eye, mul(dir, depth / Math.max(dot(dir, cam.forward), 1e-3)));
  if (Math.abs(dir[1]) > 1e-4) {
    const t = (height - cam.eye[1]) / dir[1];
    if (t > 0.05 && t < 5000) return add(cam.eye, mul(dir, t));
  }
  return add(cam.eye, mul(dir, depth / Math.max(dot(dir, cam.forward), 1e-3)));
}

export type Facing = "front" | "back" | "left" | "right";

export interface Projected extends Layer {
  depth: number;
  /** Fraction of the frame height the subject fills. */
  size: number;
  facing: Facing;
  /** How far the subject's centre sits outside the frame (0 = inside). */
  outside: number;
  actor: Actor;
}

/** Height of a subject as it stands (lying and sitting subjects are lower). */
export const standingHeight = (a: Actor) => REAL_HEIGHT[a.glyph] * a.scale * (a.pose === "lie" ? 0.3 : a.pose === "sit" ? 0.72 : 1);

/** Where a subject lands in the frame: position, apparent size, facing, draw order. */
export function projectActor(cam: ShotCamera, a: Actor): Projected {
  const h = standingHeight(a);
  const centre = project(cam, [a.position[0], a.position[1] + h / 2, a.position[2]]);
  const t = Math.tan(rad(cam.fov) / 2);
  const size = (REAL_HEIGHT[a.glyph] * a.scale) / (2 * Math.max(centre.depth, 0.05) * t);

  // Turn 0 faces +z, i.e. towards the default camera.
  const yaw = rad(a.rotation[1]);
  const fwd: Vec3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const toCam = -dot(fwd, cam.forward);
  const side = dot(fwd, cam.right);
  const facing: Facing = toCam > 0.5 ? "front" : toCam < -0.5 ? "back" : side >= 0 ? "right" : "left";

  const outside = Math.max(0, Math.abs(centre.x - 0.5) - 0.5, Math.abs(centre.y - 0.5) - 0.5);
  return {
    id: a.id,
    glyph: a.glyph,
    label: a.label,
    count: a.count,
    pose: a.pose,
    ...(a.image ? { image: a.image } : {}),
    x: centre.x,
    y: centre.y,
    scale: size / LAYER_HEIGHT[a.glyph],
    rotation: a.rotation[2] - cam.roll,
    flip: side < -0.2,
    facing,
    depth: centre.depth,
    size,
    outside,
    actor: a,
  };
}

/** Every subject in the frame, furthest first (the order to draw them in). */
export function projectScene(cam: ShotCamera, actors: Actor[]): Projected[] {
  return actors
    .map((a) => projectActor(cam, a))
    .filter((p) => p.depth > 0.05)
    .sort((a, b) => b.depth - a.depth);
}

/** Subjects nearest the camera first: the first one not in the sky and not text is the main subject. */
export function byPriority(projected: Projected[]): Projected[] {
  // Sky and placed text never lead: the main subject is the nearest thing on the ground.
  const late = (p: Projected) => Number(isSky(p.glyph) || isText(p.glyph));
  return [...projected].sort((a, b) => late(a) - late(b) || a.depth - b.depth);
}
