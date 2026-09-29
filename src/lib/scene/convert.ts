import { clamp, LAYER_HEIGHT, type Layer } from "../sketch/layers";
import { projectActor, standingHeight, unproject, type ShotCamera } from "./camera";
import { isSky, REAL_HEIGHT, widthRatio, type Actor, type Vec3 } from "./model";

/** Place a 3D actor so that, through `cam`, it lands where a 2D layer was (old share links). */
export function actorFromLayer(cam: ShotCamera, l: Layer): Actor {
  const bottomY = l.y + (LAYER_HEIGHT[l.glyph] * l.scale) / 2;
  const sky = isSky(l.glyph);
  const base = sky ? unproject(cam, l.x, l.y, 1e6, 600) : unproject(cam, l.x, Math.min(bottomY, 0.999), 0, 8);
  const actor: Actor = {
    id: l.id,
    glyph: l.glyph,
    label: l.label,
    position: [base[0], sky ? Math.max(base[1], 60) : 0, base[2]],
    rotation: [0, l.flip ? -90 : 0, l.rotation],
    scale: 1,
    pose: l.pose ?? "stand",
    count: l.count ?? 1,
  };
  // Match the size the layer had on screen.
  const natural = projectActor(cam, actor).size;
  const wanted = LAYER_HEIGHT[l.glyph] * l.scale;
  actor.scale = clamp(natural > 0 ? wanted / natural : 1, 0.05, 20);
  return actor;
}

/**
 * Apply an edit made on the flat sketch to the 3D actor: moving slides it
 * over the ground (or keeps its distance, for sky objects), scaling scales
 * it, rotating rolls it.
 */
export function applyLayerEdit(cam: ShotCamera, a: Actor, patch: Partial<Layer>): Actor {
  const now = projectActor(cam, a);
  let next: Actor = { ...a };
  if (patch.x !== undefined || patch.y !== undefined) {
    const x = patch.x ?? now.x;
    const y = patch.y ?? now.y;
    // The drag moves the subject's centre; keep the base at its own height.
    const half = (standingHeight(a) / 2) * (1 / (2 * Math.max(now.depth, 0.05) * Math.tan((cam.fov * Math.PI) / 360)));
    if (cam.flat) {
      // 2D board: move within the picture only; distance stays where it was.
      const c = unproject(cam, x, y, 0, now.depth);
      next.position = [c[0], c[1] - standingHeight(a) / 2, a.position[2]];
    } else {
      const p: Vec3 = isSky(a.glyph)
        ? unproject(cam, x, y, 1e6, now.depth)
        : unproject(cam, x, Math.min(y + half, 0.999), a.position[1], now.depth);
      next.position = isSky(a.glyph) ? p : [p[0], a.position[1], p[2]];
    }
  }
  if (patch.scale !== undefined && now.scale > 0) next.scale = clamp((a.scale * patch.scale) / now.scale, 0.05, 20);
  if (patch.rotation !== undefined) next.rotation = [a.rotation[0], a.rotation[1], patch.rotation + cam.roll];
  if (patch.flip !== undefined && patch.flip !== now.flip) next.rotation = [next.rotation[0], next.rotation[1] + 180, next.rotation[2]];
  if (patch.label !== undefined) next = { ...next, label: patch.label };
  return next;
}

/** Frame slots for new subjects: centre first, then alternating either side. */
const SLOTS = [0.5, 0.3, 0.7, 0.18, 0.82, 0.4, 0.6];

/**
 * Slide a new subject sideways so it lands in a free slot of the current
 * frame instead of off-screen. Sky objects go high in the frame; text goes
 * near the top, centred like a title.
 */
export function placeInFrame(cam: ShotCamera, a: Actor, index: number): Actor {
  const now = projectActor(cam, a);
  const slot = SLOTS[index % SLOTS.length]!;
  if (isSky(a.glyph)) {
    const p = unproject(cam, slot, 0.18, 1e6, now.depth);
    return { ...a, position: p };
  }
  if (a.glyph === "text") {
    const placed = { ...a, position: unproject(cam, 0.5, 0.14 + 0.1 * (index % 3), 1e6, now.depth) };
    // Size it like a title: at most 60% of the frame wide and a tenth of it tall.
    const p = projectActor(cam, placed);
    const wide = (p.size * widthRatio(a.glyph, a.label)) / cam.aspect;
    return { ...placed, scale: clamp(a.scale * Math.min(0.6 / Math.max(wide, 1e-6), 0.1 / Math.max(p.size, 1e-6)), 0.05, 20) };
  }
  // Sideways distance per unit of frame width at this subject's depth.
  const width = 2 * Math.max(now.depth, 0.5) * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect;
  const dx = (slot - now.x) * width;
  return { ...a, position: [a.position[0] + dx * cam.right[0], a.position[1], a.position[2] + dx * cam.right[2]] };
}

/** Natural height, for display ("1.75 m"). */
export const heightOf = (a: Actor) => REAL_HEIGHT[a.glyph] * a.scale;
