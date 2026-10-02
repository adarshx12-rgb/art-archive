import type { Pose } from "../sketch/parse";

/**
 * The skeleton behind a stick figure, posed with the puppet tool. Joints are
 * in figure units: x to the right of the figure's centre and y up from its
 * base, both as fractions of its height. "L" and "R" are the sides of the
 * frame the limbs are on (as drawn, before any flip).
 */

export type Joint = "head" | "neck" | "hip" | "elbowL" | "handL" | "elbowR" | "handR" | "kneeL" | "footL" | "kneeR" | "footR";
export const JOINTS: Joint[] = ["head", "neck", "hip", "elbowL", "handL", "elbowR", "handR", "kneeL", "footL", "kneeR", "footR"];

export type Pt = { x: number; y: number };
export type Rig = Record<Joint, Pt>;

const HEAD = 0.075;
const ARM = 0.175;
const LEG = 0.245;

const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const len = (a: Pt) => Math.hypot(a.x, a.y);
const dist = (a: Pt, b: Pt) => len(sub(a, b));
const unit = (a: Pt): Pt => {
  const l = len(a);
  return l < 1e-9 ? { x: 0, y: 1 } : { x: a.x / l, y: a.y / l };
};
const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const rotateAbout = (p: Pt, c: Pt, rad: number): Pt => {
  const d = sub(p, c);
  return { x: c.x + d.x * Math.cos(rad) - d.y * Math.sin(rad), y: c.y + d.x * Math.sin(rad) + d.y * Math.cos(rad) };
};

/** Where the arms join: just below the neck, along the spine. */
export const shoulderOf = (r: Rig): Pt => add(r.neck, scale(unit(sub(r.hip, r.neck)), 0.04));

/**
 * Two bones from root towards target (shoulder–elbow–hand, hip–knee–foot):
 * the middle joint bends to one side (bend ±1) and neither bone stretches.
 * A target out of reach gets a straight limb pointing at it.
 */
export function solveLimb(root: Pt, target: Pt, l1: number, l2: number, bend: number): { mid: Pt; end: Pt } {
  const to = sub(target, root);
  const d = Math.min(Math.max(len(to), Math.abs(l1 - l2) + 1e-6), l1 + l2 - 1e-9);
  const angle = len(to) < 1e-9 ? -Math.PI / 2 : Math.atan2(to.y, to.x);
  const cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = Math.acos(Math.min(Math.max(cos, -1), 1)) * (bend < 0 ? -1 : 1);
  return {
    mid: add(root, { x: l1 * Math.cos(angle + a), y: l1 * Math.sin(angle + a) }),
    end: add(root, { x: d * Math.cos(angle), y: d * Math.sin(angle) }),
  };
}

/** Which way a limb is bent now, so moving its end keeps the elbow or knee on the same side. */
const bendOf = (root: Pt, mid: Pt, end: Pt) => {
  const a = sub(end, root);
  const b = sub(mid, root);
  return a.x * b.y - a.y * b.x >= 0 ? 1 : -1;
};

/** A limb bent outward, away from the body's centre line (side -1 left, 1 right). */
function outward(root: Pt, target: Pt, l1: number, l2: number, side: number) {
  const a = solveLimb(root, target, l1, l2, 1);
  const b = solveLimb(root, target, l1, l2, -1);
  return a.mid.x * side >= b.mid.x * side ? a : b;
}

function build(hip: Pt, neck: Pt, hands: [Pt, Pt], feet: [Pt, Pt], elbows?: [Pt, Pt], knees?: [Pt, Pt]): Rig {
  const head = add(neck, scale(unit(sub(neck, hip)), HEAD));
  const base = { head, neck, hip } as Rig;
  const sh = shoulderOf(base);
  const arm = (i: 0 | 1) => (elbows ? { mid: elbows[i], end: hands[i] } : outward(sh, hands[i], ARM, ARM, i ? 1 : -1));
  const leg = (i: 0 | 1) => (knees ? { mid: knees[i], end: feet[i] } : outward(hip, feet[i], LEG, LEG, i ? 1 : -1));
  const [aL, aR, lL, lR] = [arm(0), arm(1), leg(0), leg(1)];
  return { head, neck, hip, elbowL: aL.mid, handL: aL.end, elbowR: aR.mid, handR: aR.end, kneeL: lL.mid, footL: lL.end, kneeR: lR.mid, footR: lR.end };
}

const P = (x: number, y: number): Pt => ({ x, y });

/** The skeleton of each named pose, matching how the sketch draws it. */
export function rigFor(pose: Pose): Rig {
  switch (pose) {
    case "walk":
      return build(P(0, 0.47), P(0, 0.85), [P(-0.13, 0.55), P(0.15, 0.5)], [P(-0.15, 0), P(0.13, 0)]);
    case "run":
      return build(P(0, 0.47), P(0.08, 0.85), [P(-0.2, 0.76), P(0.26, 0.79)], [P(-0.24, 0.1), P(0.2, 0)], [P(-0.1, 0.67), P(0.18, 0.69)], [P(-0.12, 0.2), P(0.14, 0.2)]);
    case "dance":
      return build(P(0, 0.47), P(0, 0.85), [P(-0.2, 0.98), P(0.22, 0.91)], [P(-0.14, 0), P(0.2, 0.14)], undefined, [P(-0.07, 0.235), P(0.08, 0.22)]);
    case "sit":
      return build(P(0, 0.3), P(0, 0.66), [P(0.2, 0.46), P(0.2, 0.46)], [P(0.2, 0), P(0.2, 0)], [P(0.12, 0.42), P(0.12, 0.42)], [P(0.2, 0.3), P(0.2, 0.3)]);
    case "lie": {
      // The standing skeleton laid down, head to the left.
      const s = rigFor("stand");
      return Object.fromEntries(JOINTS.map((j) => [j, P(-(s[j].y - 0.5), s[j].x + 0.12)])) as Rig;
    }
    default:
      return build(P(0, 0.47), P(0, 0.85), [P(-0.15, 0.5), P(0.15, 0.5)], [P(-0.09, 0), P(0.09, 0)]);
  }
}

const LIMBS = {
  handL: ["elbowL", "arm"],
  handR: ["elbowR", "arm"],
  footL: ["kneeL", "leg"],
  footR: ["kneeR", "leg"],
} as const;
const MIDS = { elbowL: "handL", elbowR: "handR", kneeL: "footL", kneeR: "footR" } as const;
const UPPER: Joint[] = ["head", "neck", "elbowL", "handL", "elbowR", "handR"];

/** Moves one pin like a puppet: ends pull their limb along, middles bend, the head tilts the body, the hips crouch. */
export function dragJoint(rig: Rig, joint: Joint, target: Pt): Rig {
  const r = { ...rig };
  const rootOf = (kind: "arm" | "leg") => (kind === "arm" ? shoulderOf(rig) : rig.hip);
  const ground = (p: Pt): Pt => ({ x: p.x, y: Math.max(p.y, 0) });

  if (joint in LIMBS) {
    const [mid, kind] = LIMBS[joint as keyof typeof LIMBS];
    const root = rootOf(kind);
    const t = kind === "leg" ? ground(target) : target;
    const s = solveLimb(root, t, dist(root, rig[mid]), dist(rig[mid], rig[joint]), bendOf(root, rig[mid], rig[joint]));
    r[mid] = s.mid;
    r[joint] = kind === "leg" ? ground(s.end) : s.end;
    return r;
  }

  if (joint in MIDS) {
    // The upper bone swings to the pin; the lower one keeps its direction.
    const end = MIDS[joint as keyof typeof MIDS];
    const root = rootOf(joint.startsWith("elbow") ? "arm" : "leg");
    const mid = add(root, scale(unit(sub(target, root)), dist(root, rig[joint])));
    r[joint] = mid;
    r[end] = add(mid, sub(rig[end], rig[joint]));
    if (joint.startsWith("knee")) {
      r[joint] = ground(r[joint]);
      r[end] = ground(r[end]);
    }
    return r;
  }

  if (joint === "head" || joint === "neck") {
    // The upper body turns around the hips, towards the pin.
    const from = Math.atan2(rig[joint].y - rig.hip.y, rig[joint].x - rig.hip.x);
    const to = Math.atan2(target.y - rig.hip.y, target.x - rig.hip.x);
    for (const j of UPPER) r[j] = rotateAbout(rig[j], rig.hip, to - from);
    return r;
  }

  // The hips: the body above moves with them, the feet stay where they are.
  let delta = sub(target, rig.hip);
  const reach = (side: "L" | "R") => dist(rig.hip, rig[`knee${side}`]) + dist(rig[`knee${side}`], rig[`foot${side}`]);
  const fits = (d: Pt) => (["L", "R"] as const).every((s) => dist(add(rig.hip, d), rig[`foot${s}`]) <= reach(s) * 0.999);
  for (let i = 0; i < 30 && !fits(delta); i++) delta = scale(delta, 0.85);
  if (!fits(delta)) return rig;
  r.hip = add(rig.hip, delta);
  for (const j of UPPER) r[j] = add(rig[j], delta);
  for (const s of ["L", "R"] as const) {
    const knee = `knee${s}` as const;
    const foot = `foot${s}` as const;
    const l = solveLimb(r.hip, rig[foot], dist(rig.hip, rig[knee]), dist(rig[knee], rig[foot]), bendOf(rig.hip, rig[knee], rig[foot]));
    r[knee] = l.mid;
    r[foot] = rig[foot];
  }
  return r;
}

/** The same pose seen in a mirror: left and right swap. */
export function mirrorRig(rig: Rig): Rig {
  const swap = (j: Joint) => (j.endsWith("L") ? (j.slice(0, -1) + "R") : j.endsWith("R") ? j.slice(0, -1) + "L" : j) as Joint;
  return Object.fromEntries(JOINTS.map((j) => [j, { x: -rig[swap(j)].x, y: rig[swap(j)].y }])) as Rig;
}

// ——— Share links: 11 joints as x,y pairs, two decimals ———

export function encodeRig(rig: Rig): string {
  return JOINTS.map((j) => `${Math.round(rig[j].x * 100) / 100},${Math.round(rig[j].y * 100) / 100}`).join(",");
}

export function decodeRig(raw: string): Rig | null {
  const n = raw.split(",").map(Number);
  if (n.length !== JOINTS.length * 2 || n.some((v) => !Number.isFinite(v))) return null;
  const c = (v: number) => Math.min(Math.max(v, -2), 2);
  return Object.fromEntries(JOINTS.map((j, i) => [j, P(c(n[2 * i]!), c(n[2 * i + 1]!))])) as Rig;
}

// ——— In words, for the prompt ———

/** The pose in plain words, as seen in the frame; empty for a plain standing pose. */
export function describeRig(posed: Rig): string {
  // Read the pose as a share link stores it, so a reloaded link words it the same.
  const rig = decodeRig(encodeRig(posed)) ?? posed;
  const sh = shoulderOf(rig);
  const parts: string[] = [];

  // Legs and stance
  const kneeling = (["L", "R"] as const).find((s) => rig[`knee${s}`].y < 0.08);
  const sitting = rig.hip.y < 0.36 && (["L", "R"] as const).every((s) => rig[`knee${s}`].y > rig.hip.y - 0.05 && Math.abs(rig[`knee${s}`].x - rig.hip.x) > 0.12);
  if (kneeling) parts.push(`kneeling on the ${kneeling === "L" ? "left" : "right"} knee`);
  else if (sitting) parts.push("sitting");
  else if (rig.hip.y < 0.38) parts.push("crouching with knees bent");
  if (!kneeling && !sitting) {
    for (const s of ["L", "R"] as const) if (rig[`foot${s}`].y > 0.12) parts.push(`the leg on the ${s === "L" ? "left" : "right"} lifted`);
  }
  if (Math.abs(rig.footL.x - rig.footR.x) > 0.4) parts.push("in a wide stance");

  // Upper body
  const lean = (Math.atan2(rig.neck.x - rig.hip.x, rig.neck.y - rig.hip.y) * 180) / Math.PI;
  const way = lean > 0 ? "right" : "left";
  if (Math.abs(lean) > 60) parts.push(`bent over to the ${way}`);
  else if (Math.abs(lean) > 15) parts.push(`leaning to the ${way}`);

  // Arms
  const arm = (s: "L" | "R") => {
    const hand = rig[`hand${s}`];
    const elbow = rig[`elbow${s}`];
    const side = s === "L" ? -1 : 1;
    if (hand.y > rig.head.y) return "raised overhead";
    if (hand.y > sh.y + 0.03) return "raised";
    // Out to the side: well away from the body, and no more than about 30° below level.
    if (Math.abs(hand.x - sh.x) > 0.24 && sh.y - hand.y < 0.58 * Math.abs(hand.x - sh.x)) return "stretched out to the side";
    if ((hand.x - rig.hip.x) * side < -0.04) return "reaching across the body";
    if (Math.abs(hand.y - rig.hip.y) < 0.1 && dist(hand, P(rig.hip.x + side * 0.08, rig.hip.y)) < 0.12 && (elbow.x - rig.hip.x) * side > 0.14) return "on the hip";
    return "";
  };
  const [l, r] = [arm("L"), arm("R")];
  if (l && l === r) parts.push(l === "on the hip" ? "both hands on the hips" : `both arms ${l}`);
  else {
    if (l) parts.push(l === "on the hip" ? "the hand on the left on the hip" : `the arm on the left ${l}`);
    if (r) parts.push(r === "on the hip" ? "the hand on the right on the hip" : `the arm on the right ${r}`);
  }
  return parts.join(", ");
}
