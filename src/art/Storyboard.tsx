import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { inkOn } from "../lib/color";
import type { ResolvedColour } from "../lib/prompt/compose";
import { angleOptions, eraOptions, findOption, genreOptions, lensOptions, shotOptions } from "../lib/prompt/options";
import type { BuilderState } from "../lib/prompt/state";
import { horizonAt, project, type ShotCamera } from "../lib/scene/camera";
import type { Vec3 } from "../lib/scene/model";
import { clamp, LAYER_ASPECT, LAYER_HEIGHT, type Layer } from "../lib/sketch/layers";
import { parseSubject, type Glyph, type Pose, type SketchItem } from "../lib/sketch/parse";
import { rng } from "./util";

/**
 * A rough storyboard sketch of the builder settings: stick figures and
 * simple shapes on a framing grid. It confirms layout, camera, palette and
 * light at a glance; it is not a picture of the final result.
 */

const W = 1000;

/** Figure height as a fraction of the frame height, per shot size. */
const SHOT_SCALE: Record<string, number> = {
  "extreme-wide": 0.1,
  wide: 0.24,
  full: 0.62,
  medium: 1.3,
  "close-up": 2.7,
  "extreme-close-up": 6,
};

/** Horizon height as a fraction of the frame, per camera angle. */
const HORIZON: Record<string, number> = { eye: 0.56, low: 0.8, high: 0.28, dutch: 0.56, overhead: 0 };

/** How much each lens widens (>1) or compresses (<1) perspective. */
const LENS_SPREAD: Record<string, number> = { auto: 1, "14": 1.9, "24": 1.45, "35": 1.15, "50": 1, "85": 0.75, "135": 0.55 };

/** Height of front-layer things relative to a standing person. */
const FRONT_SIZE: Partial<Record<Glyph, number>> = {
  person: 1, child: 0.65, robot: 1, animal: 0.38, "big-animal": 0.85, fish: 0.3, car: 0.5, bike: 0.55, boat: 0.6, train: 0.75,
  table: 0.42, chair: 0.5, bed: 0.35, lamp: 0.6, flower: 0.22,
};

/** Small things held by the main figure (or set on a table). */
const HELD = new Set<Glyph>(["book", "cup", "candle", "sword", "guitar", "device", "bottle"]);
const ACTORS = new Set<Glyph>(["person", "child", "robot", "animal", "big-animal", "car", "bike", "boat", "train", "fish"]);
const VEHICLES = new Set<Glyph>(["car", "bike", "boat", "train"]);

/** Width each actor takes up, relative to a standing person's height. */
const ACTOR_WIDTH: Partial<Record<Glyph, number>> = {
  person: 0.45, child: 0.35, robot: 0.45, animal: 0.5, "big-animal": 1.1, fish: 0.5, car: 1.35, bike: 0.65, boat: 1.1, train: 2.8,
};

/** Footprint size in the overhead view, per shot size. */
const TOP_SCALE: Record<string, number> = { "extreme-wide": 0.45, wide: 0.7, full: 1, medium: 1.6, "close-up": 2.6, "extreme-close-up": 4 };

interface Ctx {
  ink: string;
  bg: string;
  primary: string;
  secondary: string;
  accent: string;
  sw: number;
}

const pts = (...p: number[]) => p.join(" ");

// ——— Figures ———

function figure(x: number, base: number, h: number, pose: Pose, c: Ctx, main: boolean, robot = false, bust = false, facing: Layer["facing"] = "front"): ReactNode {
  const r = h * 0.075;
  const sw = Math.min(Math.max(h * 0.028, 2.5), 9);
  const stroke = { stroke: c.ink, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const headFill = main ? c.accent : c.bg;
  const face = (cx: number, cy: number) =>
    facing === "back" ? null : facing === "left" || facing === "right" ? (
      // Profile: one eye and a nose on the side it faces.
      <g>
        <circle cx={cx + (facing === "right" ? 1 : -1) * r * 0.45} cy={cy - r * 0.15} r={Math.max(r * 0.09, 2)} fill={c.ink} />
        <path d={`M${cx + (facing === "right" ? 1 : -1) * r * 0.95} ${cy - r * 0.05} l${(facing === "right" ? 1 : -1) * r * 0.25} ${r * 0.2} l${(facing === "right" ? -1 : 1) * r * 0.25} ${r * 0.1}`} fill="none" stroke={c.ink} strokeWidth={Math.max(r * 0.08, 2)} />
      </g>
    ) : r > 28 && !robot ? (
      <g>
        <circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={r * 0.08} fill={c.ink} />
        <circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={r * 0.08} fill={c.ink} />
        <path d={`M${cx - r * 0.3} ${cy + r * 0.4} q${r * 0.3} ${r * 0.18} ${r * 0.6} 0`} {...stroke} strokeWidth={sw * 0.6} />
      </g>
    ) : null;
  const head = (cx: number, cy: number) =>
    robot ? (
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.2} fill={headFill} {...{ stroke: c.ink, strokeWidth: sw }} />
    ) : (
      <circle cx={cx} cy={cy} r={r} fill={headFill} stroke={c.ink} strokeWidth={sw} />
    );

  // Close-ups: head and shoulders only.
  if (bust) {
    const cy = base - h + r;
    const neckY = cy + r;
    return (
      <g>
        <path d={`M${x - 0.34 * h} ${neckY + 0.2 * h} Q${x - 0.3 * h} ${neckY + 0.05 * h} ${x - 0.08 * h} ${neckY + 0.04 * h} L${x + 0.08 * h} ${neckY + 0.04 * h} Q${x + 0.3 * h} ${neckY + 0.05 * h} ${x + 0.34 * h} ${neckY + 0.2 * h}`} {...stroke} />
        <line x1={x} y1={neckY} x2={x} y2={neckY + 0.04 * h} {...stroke} />
        {head(x, cy)}
        {face(x, cy)}
      </g>
    );
  }

  if (pose === "lie") {
    const y = base - r;
    return (
      <g>
        <polyline points={pts(x - 0.36 * h, y, x + 0.12 * h, y, x + 0.46 * h, y + r * 0.6)} {...stroke} />
        <polyline points={pts(x - 0.2 * h, y, x + 0.05 * h, y - 0.06 * h)} {...stroke} />
        {head(x - 0.36 * h - r, y - r * 0.4)}
      </g>
    );
  }

  if (pose === "sit") {
    const hipY = base - 0.3 * h;
    const neckY = hipY - 0.36 * h;
    return (
      <g>
        <line x1={x} y1={hipY} x2={x} y2={neckY} {...stroke} />
        <polyline points={pts(x, hipY, x + 0.2 * h, hipY, x + 0.2 * h, base)} {...stroke} />
        <polyline points={pts(x, neckY + 0.05 * h, x + 0.12 * h, hipY - 0.12 * h, x + 0.2 * h, hipY - 0.16 * h)} {...stroke} />
        {head(x, neckY - r)}
        {face(x, neckY - r)}
      </g>
    );
  }

  const lean = pose === "run" ? 0.08 * h : 0;
  const neck = { x: x + lean, y: base - h + 2 * r };
  const hip = { x, y: base - 0.47 * h };
  const sh = neck.y + 0.04 * h;
  const arms: Record<Exclude<Pose, "lie" | "sit">, number[][]> = {
    stand: [[x - 0.15 * h, base - 0.5 * h], [x + 0.15 * h, base - 0.5 * h]],
    walk: [[x - 0.13 * h, base - 0.55 * h], [x + 0.15 * h, base - 0.5 * h]],
    run: [[x - 0.1 * h, sh + 0.14 * h, x - 0.2 * h, sh + 0.05 * h], [x + 0.18 * h, sh + 0.12 * h, x + 0.26 * h, sh + 0.02 * h]],
    dance: [[x - 0.2 * h, base - h + 0.02 * h], [x + 0.22 * h, sh - 0.1 * h]],
  };
  const legs: Record<Exclude<Pose, "lie" | "sit">, number[][]> = {
    stand: [[x - 0.09 * h, base], [x + 0.09 * h, base]],
    walk: [[x - 0.15 * h, base], [x + 0.13 * h, base]],
    run: [[x - 0.12 * h, base - 0.2 * h, x - 0.24 * h, base - 0.1 * h], [x + 0.14 * h, base - 0.2 * h, x + 0.2 * h, base]],
    dance: [[x - 0.14 * h, base], [x + 0.08 * h, base - 0.22 * h, x + 0.2 * h, base - 0.14 * h]],
  };
  const p = pose as Exclude<Pose, "lie" | "sit">;
  return (
    <g>
      {robot ? (
        <rect x={x - 0.1 * h} y={neck.y} width={0.2 * h} height={hip.y - neck.y} fill={c.bg} stroke={c.ink} strokeWidth={sw} />
      ) : (
        <line x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} {...stroke} />
      )}
      {arms[p].map((a, i) => (
        <polyline key={`a${i}`} points={pts(neck.x, sh, ...a)} {...stroke} />
      ))}
      {legs[p].map((l, i) => (
        <polyline key={`l${i}`} points={pts(hip.x, hip.y, ...l)} {...stroke} />
      ))}
      {head(neck.x, neck.y - r)}
      {face(neck.x, neck.y - r)}
    </g>
  );
}

/** Hand position of a figure, for held props. */
const handOf = (x: number, base: number, h: number, pose: Pose) =>
  pose === "sit" ? { x: x + 0.2 * h, y: base - 0.46 * h } : pose === "lie" ? { x: x + 0.05 * h, y: base - 0.12 * h } : { x: x + 0.16 * h, y: base - 0.5 * h };

function frontGlyph(g: Glyph, x: number, base: number, s: number, c: Ctx, main: boolean): ReactNode {
  const sw = Math.min(Math.max(s * 0.03, 2.5), 8);
  const st = { stroke: c.ink, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const fillMain = main ? c.accent : c.secondary;
  switch (g) {
    case "animal":
    case "big-animal": {
      const legH = g === "big-animal" ? 0.45 * s : 0.35 * s;
      const by = base - legH - 0.18 * s;
      return (
        <g {...st}>
          {[-0.4, -0.22, 0.22, 0.4].map((d) => (
            <line key={d} x1={x + d * s} y1={by} x2={x + d * s} y2={base} />
          ))}
          <ellipse cx={x} cy={by} rx={0.55 * s} ry={0.2 * s} fill={fillMain} />
          <circle cx={x + 0.62 * s} cy={by - 0.22 * s} r={0.16 * s} fill={fillMain} />
          <line x1={x - 0.55 * s} y1={by - 0.05 * s} x2={x - 0.75 * s} y2={by - 0.25 * s} />
        </g>
      );
    }
    case "fish":
      return (
        <g {...st} fill={fillMain}>
          <ellipse cx={x} cy={base - s / 2} rx={s} ry={s * 0.42} />
          <path d={`M${x - s} ${base - s / 2} l${-s * 0.5} ${-s * 0.35} v${s * 0.7}z`} />
        </g>
      );
    case "car":
      return (
        <g {...st} fill={fillMain}>
          <path d={`M${x - 1.25 * s} ${base - 0.18 * s} v${-0.42 * s} h${0.45 * s} l${0.3 * s} ${-0.38 * s} h${0.9 * s} l${0.3 * s} ${0.38 * s} h${0.55 * s} v${0.42 * s}z`} />
          <circle cx={x - 0.7 * s} cy={base - 0.16 * s} r={0.18 * s} fill={c.ink} />
          <circle cx={x + 0.7 * s} cy={base - 0.16 * s} r={0.18 * s} fill={c.ink} />
        </g>
      );
    case "bike":
      return (
        <g {...st} fill="none">
          <circle cx={x - 0.45 * s} cy={base - 0.3 * s} r={0.3 * s} />
          <circle cx={x + 0.45 * s} cy={base - 0.3 * s} r={0.3 * s} />
          <polyline points={pts(x - 0.45 * s, base - 0.3 * s, x - 0.1 * s, base - 0.75 * s, x + 0.35 * s, base - 0.75 * s, x + 0.45 * s, base - 0.3 * s)} />
        </g>
      );
    case "boat":
      return (
        <g {...st} fill={fillMain}>
          <path d={`M${x - 0.9 * s} ${base - 0.3 * s} h${1.8 * s} l${-0.3 * s} ${0.3 * s} h${-1.2 * s}z`} />
          <line x1={x} y1={base - 0.3 * s} x2={x} y2={base - 1.5 * s} />
          <path d={`M${x + 0.05 * s} ${base - 1.45 * s} l${0.6 * s} ${1.05 * s} h${-0.6 * s}z`} fill={c.bg} />
        </g>
      );
    case "train":
      return (
        <g {...st} fill={fillMain}>
          <rect x={x - 1.8 * s} y={base - s} width={3.6 * s} height={0.8 * s} rx={0.15 * s} />
          {[-1.3, -0.5, 0.3, 1.1].map((d) => (
            <rect key={d} x={x + d * s} y={base - 0.85 * s} width={0.45 * s} height={0.3 * s} fill={c.bg} />
          ))}
          {[-1.3, -0.4, 0.5, 1.4].map((d) => (
            <circle key={d} cx={x + d * s} cy={base - 0.12 * s} r={0.12 * s} fill={c.ink} />
          ))}
        </g>
      );
    case "table":
      return (
        <g {...st} fill="none">
          <line x1={x - 0.7 * s} y1={base - s} x2={x + 0.7 * s} y2={base - s} strokeWidth={sw * 1.4} />
          <line x1={x - 0.55 * s} y1={base - s} x2={x - 0.55 * s} y2={base} />
          <line x1={x + 0.55 * s} y1={base - s} x2={x + 0.55 * s} y2={base} />
        </g>
      );
    case "chair":
      return (
        <g {...st} fill="none">
          <polyline points={pts(x - 0.3 * s, base - 1.2 * s, x - 0.3 * s, base)} />
          <polyline points={pts(x - 0.3 * s, base - 0.55 * s, x + 0.35 * s, base - 0.55 * s, x + 0.35 * s, base)} />
        </g>
      );
    case "bed":
      return (
        <g {...st} fill={c.secondary}>
          <rect x={x - 0.7 * s * 2} y={base - 0.55 * s} width={2.8 * s} height={0.4 * s} />
          <rect x={x - 0.7 * s * 2} y={base - 1.1 * s} width={0.15 * s} height={1.1 * s} fill={c.ink} />
        </g>
      );
    case "lamp":
      return (
        <g {...st} fill={c.accent}>
          <line x1={x} y1={base} x2={x} y2={base - 0.8 * s} />
          <path d={`M${x - 0.18 * s} ${base - 0.8 * s} l${0.08 * s} ${-0.25 * s} h${0.2 * s} l${0.08 * s} ${0.25 * s}z`} />
        </g>
      );
    case "flower":
      return (
        <g {...st}>
          <line x1={x} y1={base} x2={x} y2={base - s} />
          <circle cx={x} cy={base - s} r={0.18 * s} fill={c.accent} />
        </g>
      );
    default:
      return heldGlyph(g, x, base, s, c);
  }
}

/** Small props, drawn at `y` (their bottom) with height `s`. */
function heldGlyph(g: Glyph, x: number, y: number, s: number, c: Ctx): ReactNode {
  const sw = Math.min(Math.max(s * 0.06, 2), 6);
  const st = { stroke: c.ink, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (g) {
    case "book":
      return <rect x={x - 0.6 * s} y={y - s} width={1.2 * s} height={s} fill={c.accent} {...st} />;
    case "cup":
      return (
        <g {...st} fill={c.accent}>
          <path d={`M${x - 0.35 * s} ${y - s} h${0.7 * s} l${-0.08 * s} ${s} h${-0.54 * s}z`} />
          <path d={`M${x + 0.33 * s} ${y - 0.75 * s} q${0.3 * s} ${0.2 * s} 0 ${0.45 * s}`} fill="none" />
        </g>
      );
    case "candle":
      return (
        <g {...st}>
          <rect x={x - 0.12 * s} y={y - 0.75 * s} width={0.24 * s} height={0.75 * s} fill={c.bg} />
          <path d={`M${x} ${y - s} q${0.12 * s} ${0.14 * s} 0 ${0.22 * s} q${-0.12 * s} ${-0.08 * s} 0 ${-0.22 * s}`} fill={c.accent} />
        </g>
      );
    case "sword":
      return (
        <g {...st}>
          <line x1={x} y1={y} x2={x} y2={y - s} />
          <line x1={x - 0.15 * s} y1={y - 0.2 * s} x2={x + 0.15 * s} y2={y - 0.2 * s} />
        </g>
      );
    case "guitar":
      return (
        <g {...st} fill={c.accent}>
          <line x1={x} y1={y - 0.35 * s} x2={x + 0.5 * s} y2={y - s} />
          <circle cx={x - 0.05 * s} cy={y - 0.2 * s} r={0.2 * s} />
          <circle cx={x + 0.1 * s} cy={y - 0.42 * s} r={0.14 * s} />
        </g>
      );
    case "device":
      return <rect x={x - 0.45 * s} y={y - s} width={0.9 * s} height={s} rx={0.08 * s} fill={c.ink} {...st} />;
    case "bottle":
      return <path d={`M${x - 0.2 * s} ${y} v${-0.65 * s} l${0.12 * s} ${-0.15 * s} v${-0.2 * s} h${0.16 * s} v${0.2 * s} l${0.12 * s} ${0.15 * s} v${0.65 * s}z`} fill={c.accent} {...st} />;
    default:
      return null;
  }
}

function backGlyph(g: Glyph, x: number, base: number, s: number, c: Ctx, interior: boolean): ReactNode {
  const sw = Math.min(Math.max(s * 0.02, 2), 5);
  const st = { stroke: c.ink, strokeWidth: sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (g) {
    case "house":
      return (
        <g {...st} fill={c.secondary}>
          <rect x={x - 0.4 * s} y={base - 0.6 * s} width={0.8 * s} height={0.6 * s} />
          <path d={`M${x - 0.5 * s} ${base - 0.6 * s} L${x} ${base - s} L${x + 0.5 * s} ${base - 0.6 * s}z`} fill={c.primary} />
          <rect x={x - 0.08 * s} y={base - 0.28 * s} width={0.16 * s} height={0.28 * s} fill={c.ink} />
        </g>
      );
    case "tower":
      return (
        <g {...st} fill={c.secondary}>
          <rect x={x - 0.14 * s} y={base - 0.78 * s} width={0.28 * s} height={0.78 * s} />
          <path d={`M${x - 0.18 * s} ${base - 0.78 * s} L${x} ${base - s} L${x + 0.18 * s} ${base - 0.78 * s}z`} fill={c.primary} />
          <path d={`M${x - 0.05 * s} ${base - 0.5 * s} v${-0.1 * s} a${0.05 * s} ${0.05 * s} 0 0 1 ${0.1 * s} 0 v${0.1 * s}z`} fill={c.accent} />
        </g>
      );
    case "lighthouse":
      return (
        <g {...st}>
          <path d={`M${x - 0.26 * s} ${base} L${x - 0.33 * s} ${base} L${x - 0.13 * s} ${base - 0.8 * s} h${0.26 * s} L${x + 0.33 * s} ${base}z`} fill={c.bg} />
          <path d={`M${x - 0.24 * s} ${base - 0.4 * s} h${0.48 * s}`} strokeWidth={sw * 3} stroke={c.primary} />
          <rect x={x - 0.12 * s} y={base - 0.95 * s} width={0.24 * s} height={0.15 * s} fill={c.accent} />
          <path d={`M${x} ${base - 0.9 * s} L${x + 1.2 * s} ${base - 1.1 * s} L${x + 1.2 * s} ${base - 0.7 * s}z`} fill={c.accent} opacity={0.35} stroke="none" />
          <path d={`M${x - 0.13 * s} ${base - 0.95 * s} L${x} ${base - s} L${x + 0.13 * s} ${base - 0.95 * s}`} fill={c.ink} />
        </g>
      );
    case "castle":
      return (
        <g {...st} fill={c.secondary}>
          <path d={`M${x - 0.5 * s} ${base} v${-0.55 * s} h${0.1 * s} v${0.06 * s} h${0.1 * s} v${-0.06 * s} h${0.1 * s} v${0.06 * s} h${0.1 * s} v${-0.06 * s} h${0.2 * s} v${0.06 * s} h${0.1 * s} v${-0.06 * s} h${0.1 * s} v${0.06 * s} h${0.1 * s} v${-0.06 * s} h${0.1 * s} v${0.55 * s}z`} />
          <rect x={x - 0.62 * s} y={base - 0.85 * s} width={0.22 * s} height={0.85 * s} />
          <rect x={x + 0.4 * s} y={base - 0.85 * s} width={0.22 * s} height={0.85 * s} />
          <path d={`M${x - 0.66 * s} ${base - 0.85 * s} L${x - 0.51 * s} ${base - s} L${x - 0.36 * s} ${base - 0.85 * s}z M${x + 0.36 * s} ${base - 0.85 * s} L${x + 0.51 * s} ${base - s} L${x + 0.66 * s} ${base - 0.85 * s}z`} fill={c.primary} />
          <path d={`M${x - 0.1 * s} ${base} v${-0.2 * s} a${0.1 * s} ${0.1 * s} 0 0 1 ${0.2 * s} 0 v${0.2 * s}`} fill={c.ink} />
        </g>
      );
    case "city":
      return (
        <g {...st} fill={c.secondary}>
          {[
            [-0.9, 0.5, 0.25],
            [-0.6, 0.85, 0.28],
            [-0.28, 0.6, 0.24],
            [0, 1, 0.3],
            [0.34, 0.7, 0.26],
            [0.64, 0.45, 0.3],
          ].map(([dx, hh, ww]) => (
            <g key={dx}>
              <rect x={x + dx! * s} y={base - hh! * s} width={ww! * s} height={hh! * s} />
              {[0.15, 0.35, 0.55, 0.75].filter((f) => f < hh! - 0.08).map((f) => (
                <line key={f} x1={x + (dx! + 0.06) * s} y1={base - (hh! - f) * s} x2={x + (dx! + ww! - 0.06) * s} y2={base - (hh! - f) * s} stroke={c.accent} strokeDasharray={`${0.04 * s} ${0.04 * s}`} />
              ))}
            </g>
          ))}
        </g>
      );
    case "tree":
      return (
        <g {...st}>
          <line x1={x} y1={base} x2={x} y2={base - 0.55 * s} strokeWidth={sw * 1.6} />
          <circle cx={x} cy={base - 0.7 * s} r={0.3 * s} fill={c.primary} />
        </g>
      );
    case "palm":
      return (
        <g {...st} fill="none">
          <path d={`M${x} ${base} q${0.12 * s} ${-0.5 * s} ${0.05 * s} ${-0.9 * s}`} strokeWidth={sw * 1.6} />
          {[-0.5, -0.25, 0, 0.25, 0.5].map((d) => (
            <path key={d} d={`M${x + 0.05 * s} ${base - 0.9 * s} q${d * s * 0.5} ${-0.15 * s} ${d * s} ${0.12 * s}`} stroke={c.primary} strokeWidth={sw * 2} />
          ))}
        </g>
      );
    case "mountain":
      return (
        <g {...st} fill={c.secondary}>
          <path d={`M${x - 1.1 * s} ${base} L${x - 0.3 * s} ${base - s} L${x + 0.25 * s} ${base - 0.45 * s} L${x + 0.55 * s} ${base - 0.7 * s} L${x + 1.2 * s} ${base}z`} />
          <path d={`M${x - 0.5 * s} ${base - 0.75 * s} L${x - 0.3 * s} ${base - s} L${x - 0.12 * s} ${base - 0.78 * s}`} fill={c.bg} />
        </g>
      );
    case "hill":
      return <path d={`M${x - 1.3 * s} ${base} Q${x} ${base - 0.8 * s} ${x + 1.3 * s} ${base}z`} fill={c.primary} opacity={0.7} {...st} />;
    case "window":
      return (
        <g {...st} fill={interior ? c.accent : c.bg} fillOpacity={0.35}>
          <rect x={x - 0.3 * s} y={base - s} width={0.6 * s} height={0.8 * s} />
          <path d={`M${x} ${base - s} v${0.8 * s} M${x - 0.3 * s} ${base - 0.6 * s} h${0.6 * s}`} fill="none" />
        </g>
      );
    case "door":
      return (
        <g {...st} fill={c.primary}>
          <path d={`M${x - 0.25 * s} ${base} v${-0.75 * s} a${0.25 * s} ${0.25 * s} 0 0 1 ${0.5 * s} 0 v${0.75 * s}z`} />
          <circle cx={x + 0.15 * s} cy={base - 0.45 * s} r={0.03 * s} fill={c.ink} />
        </g>
      );
    default:
      return null;
  }
}

function skyGlyph(g: Glyph, x: number, y: number, s: number, c: Ctx, i: number): ReactNode {
  const sw = Math.max(s * 0.05, 2.5);
  const st = { stroke: c.ink, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (g) {
    case "sun":
      return (
        <g {...st}>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            return <line key={k} x1={x + Math.cos(a) * s * 0.7} y1={y + Math.sin(a) * s * 0.7} x2={x + Math.cos(a) * s} y2={y + Math.sin(a) * s} stroke={c.accent} />;
          })}
          <circle cx={x} cy={y} r={s * 0.55} fill={c.accent} />
        </g>
      );
    case "moon":
      return <path d={`M${x} ${y - s / 2} a${s / 2} ${s / 2} 0 1 0 ${s * 0.35} ${s * 0.85} a${s * 0.4} ${s * 0.4} 0 1 1 ${-s * 0.35} ${-s * 0.85}z`} fill={c.accent} {...st} />;
    case "planet":
      return (
        <g {...st}>
          <circle cx={x} cy={y} r={s * 0.4} fill={c.accent} />
          <ellipse cx={x} cy={y} rx={s * 0.75} ry={s * 0.16} fill="none" transform={`rotate(-18 ${x} ${y})`} />
        </g>
      );
    case "cloud":
      return <path d={`M${x - s} ${y} a${s * 0.3} ${s * 0.3} 0 0 1 ${s * 0.45} ${-s * 0.25} a${s * 0.4} ${s * 0.4} 0 0 1 ${s * 0.75} ${-s * 0.05} a${s * 0.3} ${s * 0.3} 0 0 1 ${s * 0.55} ${s * 0.3}z`} fill={c.bg} {...st} />;
    case "bird":
      return <path d={`M${x - s * 0.3} ${y} q${s * 0.15} ${-s * 0.2} ${s * 0.3} 0 q${s * 0.15} ${-s * 0.2} ${s * 0.3} 0`} fill="none" {...st} strokeWidth={Math.max(s * 0.06, 2)} />;
    case "plane":
      return (
        <g {...st} transform={`rotate(-12 ${x} ${y})`}>
          <line x1={x - s * 0.6} y1={y} x2={x + s * 0.6} y2={y} strokeWidth={sw * 1.6} />
          <line x1={x + s * 0.05} y1={y} x2={x - s * 0.2} y2={y - s * 0.45} />
          <line x1={x + s * 0.05} y1={y} x2={x - s * 0.2} y2={y + s * 0.45} />
        </g>
      );
    case "star":
      return <path d={`M${x} ${y - s / 2} Q${x} ${y} ${x + s / 2} ${y} Q${x} ${y} ${x} ${y + s / 2} Q${x} ${y} ${x - s / 2} ${y} Q${x} ${y} ${x} ${y - s / 2}z`} fill={i % 2 ? c.accent : c.ink} />;
    default:
      return null;
  }
}

/** Seen from directly above: footprints rather than side views. */
function topGlyph(g: Glyph, x: number, y: number, u: number, c: Ctx, main: boolean): ReactNode {
  const sw = Math.min(Math.max(u * 0.06, 2), 7);
  const st = { stroke: c.ink, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (g) {
    case "person":
    case "child":
    case "robot": {
      const k = g === "child" ? 0.7 : 1;
      return (
        <g {...st}>
          <ellipse cx={x} cy={y} rx={u * 0.6 * k} ry={u * 0.28 * k} fill={c.secondary} />
          <line x1={x - u * 0.55 * k} y1={y} x2={x - u * 0.7 * k} y2={y + u * 0.45 * k} />
          <line x1={x + u * 0.55 * k} y1={y} x2={x + u * 0.7 * k} y2={y + u * 0.45 * k} />
          {g === "robot" ? (
            <rect x={x - u * 0.28} y={y - u * 0.28} width={u * 0.56} height={u * 0.56} fill={main ? c.accent : c.bg} />
          ) : (
            <circle cx={x} cy={y} r={u * 0.3 * k} fill={main ? c.accent : c.bg} />
          )}
        </g>
      );
    }
    case "animal":
    case "big-animal": {
      const k = g === "big-animal" ? 1.7 : 1;
      return (
        <g {...st} fill={main ? c.accent : c.secondary}>
          <ellipse cx={x} cy={y} rx={u * 0.75 * k} ry={u * 0.3 * k} />
          <circle cx={x + u * 0.85 * k} cy={y} r={u * 0.22 * k} />
          <line x1={x - u * 0.75 * k} y1={y} x2={x - u * 1.05 * k} y2={y + u * 0.15 * k} />
        </g>
      );
    }
    case "car":
    case "train":
      return (
        <g {...st}>
          <rect x={x - u * (g === "train" ? 2.6 : 1.1)} y={y - u * 0.5} width={u * (g === "train" ? 5.2 : 2.2)} height={u} rx={u * 0.25} fill={main ? c.accent : c.secondary} />
          <line x1={x + u * 0.35} y1={y - u * 0.4} x2={x + u * 0.35} y2={y + u * 0.4} />
          <line x1={x - u * 0.5} y1={y - u * 0.4} x2={x - u * 0.5} y2={y + u * 0.4} />
        </g>
      );
    case "bike":
      return (
        <g {...st}>
          <line x1={x - u * 0.7} y1={y} x2={x + u * 0.7} y2={y} strokeWidth={sw * 2} />
          <line x1={x + u * 0.45} y1={y - u * 0.3} x2={x + u * 0.45} y2={y + u * 0.3} />
        </g>
      );
    case "boat":
      return <path d={`M${x - u * 1.2} ${y - u * 0.4} h${u * 1.6} q${u * 0.8} ${u * 0.4} 0 ${u * 0.8} h${-u * 1.6}z`} fill={main ? c.accent : c.secondary} {...st} />;
    case "fish":
      return <ellipse cx={x} cy={y} rx={u * 0.6} ry={u * 0.22} fill={c.accent} {...st} />;
    case "table":
      return <rect x={x - u * 0.8} y={y - u * 0.5} width={u * 1.6} height={u} fill={c.bg} {...st} />;
    case "chair":
      return (
        <g {...st} fill={c.bg}>
          <rect x={x - u * 0.35} y={y - u * 0.35} width={u * 0.7} height={u * 0.7} />
          <line x1={x - u * 0.35} y1={y - u * 0.35} x2={x + u * 0.35} y2={y - u * 0.35} strokeWidth={sw * 2} />
        </g>
      );
    case "bed":
      return (
        <g {...st}>
          <rect x={x - u * 0.8} y={y - u * 1.2} width={u * 1.6} height={u * 2.4} fill={c.secondary} />
          <rect x={x - u * 0.6} y={y - u * 1.05} width={u * 1.2} height={u * 0.45} fill={c.bg} />
        </g>
      );
    case "lamp":
    case "flower":
      return <circle cx={x} cy={y} r={u * 0.3} fill={c.accent} {...st} />;
    case "tree":
      return (
        <g {...st}>
          <circle cx={x} cy={y} r={u * 1.3} fill={c.primary} />
          <circle cx={x} cy={y} r={u * 0.15} fill={c.ink} />
        </g>
      );
    case "palm":
      return <path d={Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2; return `M${x} ${y} L${x + Math.cos(a) * u * 1.4} ${y + Math.sin(a) * u * 1.4}`; }).join(" ")} stroke={c.primary} strokeWidth={sw * 3} strokeLinecap="round" />;
    case "house":
    case "tower":
    case "lighthouse":
    case "castle":
      return (
        <g {...st}>
          <rect x={x - u * 1.3} y={y - u} width={u * 2.6} height={u * 2} fill={c.secondary} />
          <line x1={x - u * 1.3} y1={y} x2={x + u * 1.3} y2={y} />
        </g>
      );
    case "city":
      return (
        <g {...st} fill={c.secondary}>
          {[-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => <rect key={`${i}${j}`} x={x + i * u * 1.1 - u * 0.45} y={y + j * u * 1.1 - u * 0.45} width={u * 0.9} height={u * 0.9} />))}
        </g>
      );
    case "mountain":
    case "hill":
      return (
        <g {...st} fill="none">
          {[1.6, 1.1, 0.6].map((k) => (
            <ellipse key={k} cx={x} cy={y} rx={u * k * 1.2} ry={u * k} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/**
 * A placed subject drawn around its own centre (0, 0) at height `hh`, so a
 * transform can move, scale and rotate it like a layer.
 */
function layerGlyph(g: Glyph, hh: number, c: Ctx, main: boolean, pose: Pose, facing?: Layer["facing"]): ReactNode {
  const b = hh / 2;
  switch (g) {
    case "person":
    case "child":
    case "robot":
      return figure(0, b, hh, pose, c, main, g === "robot", false, facing);
    case "animal":
      return frontGlyph(g, 0, b, hh / 0.9, c, main);
    case "big-animal":
      return frontGlyph(g, 0, b, hh, c, main);
    case "fish":
      return frontGlyph(g, 0, b, hh / 0.84, c, main);
    case "car":
    case "train":
    case "table":
      return frontGlyph(g, 0, b, hh, c, main);
    case "bike":
      return frontGlyph(g, 0, b, hh / 0.9, c, main);
    case "boat":
      return frontGlyph(g, 0, b, hh / 1.5, c, main);
    case "chair":
      return frontGlyph(g, 0, b, hh / 1.2, c, main);
    case "bed":
      return frontGlyph(g, 0, b, hh / 1.1, c, main);
    case "lamp":
      return frontGlyph(g, 0, b, hh / 1.05, c, main);
    case "flower":
      return frontGlyph(g, 0, b, hh / 1.18, c, main);
    case "hill":
      return backGlyph(g, 0, b, hh / 0.4, c, false);
    case "house":
    case "tower":
    case "lighthouse":
    case "castle":
    case "city":
    case "tree":
    case "palm":
    case "mountain":
    case "window":
    case "door":
      return backGlyph(g, 0, b, hh, c, false);
    case "sun":
      return skyGlyph(g, 0, 0, hh / 2, c, 0);
    case "moon":
    case "star":
      return skyGlyph(g, 0, 0, hh, c, 0);
    case "planet":
      return skyGlyph(g, 0, 0, hh / 0.8, c, 0);
    case "cloud":
      return skyGlyph(g, 0, b * 0.6, hh * 2, c, 0);
    case "bird":
      return skyGlyph(g, 0, b * 0.5, hh * 5, c, 0);
    case "plane":
      return skyGlyph(g, 0, 0, hh / 0.9, c, 0);
    case "thing": {
      // A storyboard placeholder: a box with a cross, labelled below.
      const w = hh * 1.2;
      const sw = Math.min(Math.max(hh * 0.02, 2.5), 6);
      return (
        <g stroke={c.ink} strokeWidth={sw} fill={main ? c.accent : c.secondary} fillOpacity={0.55} strokeLinejoin="round">
          <rect x={-w / 2} y={-hh / 2} width={w} height={hh} rx={hh * 0.08} />
          <path d={`M${-w / 2} ${-hh / 2} L${w / 2} ${hh / 2} M${w / 2} ${-hh / 2} L${-w / 2} ${hh / 2}`} fill="none" strokeOpacity={0.5} />
        </g>
      );
    }
    default:
      return heldGlyph(g, 0, b, hh, c);
  }
}

// ——— Scene ———

export interface StoryboardProps {
  state: BuilderState;
  colours: ResolvedColour[];
  keepColours?: boolean;
  keepComposition?: boolean;
  className?: string;
  /** Placed subjects become editable when these are given. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onLayerChange?: (id: string, patch: Partial<Layer>) => void;
  onLayerDelete?: (id: string) => void;
  /** Subjects to draw, already projected from the 3D scene, furthest first. */
  layers?: Layer[];
  /** The camera the scene is seen through; sets the horizon and ground grid. A flat (ortho) camera draws the 2D board. */
  camera?: ShotCamera;
  /** Dragging empty space turns ("orbit") or slides ("pan") the view; dx/dy are fractions of the frame. */
  onView?: (kind: "orbit" | "pan", dx: number, dy: number) => void;
  /** What a plain drag does; Shift or the right button always pans. */
  viewTool?: "orbit" | "pan";
}

type Drag = { mode: "move" | "scale" | "rotate"; id: string; start: { x: number; y: number }; layer: Layer };

/** The ground grid (y = 0) as seen through the camera, as one SVG path. Lines behind the camera are skipped. */
function groundGrid(cam: ShotCamera, W: number, H: number): string {
  const cx = Math.round(cam.target[0] / 2) * 2;
  const cz = Math.round(cam.target[2] / 2) * 2;
  let d = "";
  const line = (a: Vec3, b: Vec3) => {
    let pen = false;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const p = project(cam, [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t]);
      const X = p.x * W;
      const Y = p.y * H;
      if (p.depth < 0.3 || Math.abs(X) > 6 * W || Math.abs(Y) > 6 * H) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${X.toFixed(1)} ${Y.toFixed(1)}`;
      pen = true;
    }
  };
  for (let x = -30; x <= 30; x += 2) line([cx + x, 0, cz - 80], [cx + x, 0, cz + 30]);
  for (let z = -80; z <= 30; z += 2) line([cx - 30, 0, cz + z], [cx + 30, 0, cz + z]);
  return d;
}

export function Storyboard({
  state,
  colours,
  keepColours = false,
  keepComposition = false,
  className = "",
  selectedId = null,
  onSelect,
  onLayerChange,
  onLayerDelete,
  layers = [],
  camera,
  onView,
  viewTool = "orbit",
}: StoryboardProps) {
  const layersRef = useRef<SVGGElement>(null);
  const drag = useRef<Drag | null>(null);
  const viewDrag = useRef<{ kind: "orbit" | "pan"; x: number; y: number } | null>(null);
  /** The 2D board: a flat grid with only the placed subjects. */
  const flat = camera?.ortho ?? false;
  const [aw, ah] = state.aspect.split(":").map(Number) as [number, number];
  const H = Math.round((W * ah) / aw);
  const parsed = parseSubject(state.subject);
  const placedLabels = new Set(layers.flatMap((l) => [l.label.toLowerCase(), l.from ?? ""]));
  const scene = { ...parsed, items: parsed.items.filter((i) => !placedLabels.has(i.label)) };

  const byRole = (role: string, fallback: number) => (colours.find((c) => c.role === role) ?? colours[fallback % colours.length])!.hex;
  const pal = keepColours
    ? { bg: "#D9D6CF", primary: "#8A8780", secondary: "#B8B4AB", accent: "#5C5A55" }
    : { bg: byRole("background", 0), primary: byRole("primary", 1), secondary: byRole("secondary", 2), accent: byRole("accent", 3) };
  const c: Ctx = { ...pal, ink: inkOn(pal.bg), sw: 3 };

  // Camera
  const angle = state.angle === "auto" ? "eye" : state.angle;
  const overhead = camera ? camera.pitch >= 70 : angle === "overhead";
  const camHorizon = camera ? horizonAt(camera) : undefined;
  const horizon = camera ? (camHorizon === null || camHorizon === undefined ? -H : clamp(camHorizon * H, -H, 2 * H)) : HORIZON[angle]! * H;
  const spread = LENS_SPREAD[state.lens] ?? 1;
  const hasActors = scene.items.some((i) => ACTORS.has(i.glyph));
  const shot = state.shot === "auto" ? (hasActors ? "full" : "wide") : state.shot;
  const angleScale = angle === "low" ? 1.12 : angle === "high" ? 0.85 : 1;
  // One entry per glyph for props and backdrops ("city street" is one skyline, "cup of coffee" one cup).
  const uniqueByGlyph = (items: SketchItem[]) => {
    const seen = new Map<Glyph, SketchItem>();
    items.forEach((i) => {
      const prev = seen.get(i.glyph);
      if (prev) seen.set(i.glyph, i.count > prev.count ? i : prev);
      else seen.set(i.glyph, i);
    });
    return [...seen.values()];
  };

  // Front layer: expand counts into instances and place them by composition.
  const fronts = scene.items.filter((i) => i.layer === "front" && !HELD.has(i.glyph));
  const held = uniqueByGlyph(scene.items.filter((i) => HELD.has(i.glyph)));
  const instances: { item: SketchItem; k: number }[] = [];
  fronts.forEach((item) => {
    const max = VEHICLES.has(item.glyph) ? 2 : item.count;
    for (let k = 0; k < Math.min(item.count, max) && instances.length < 8; k++) instances.push({ item, k });
  });
  const actors = instances.filter((i) => ACTORS.has(i.item.glyph));
  const furniture = instances.filter((i) => !ACTORS.has(i.item.glyph));
  // Wide framings shrink a crowded group to fit; medium and closer shots crop instead.
  const units = actors.reduce((sum, a) => sum + (ACTOR_WIDTH[a.item.glyph] ?? 0.45), 0) + 0.15 * Math.max(actors.length - 1, 0);
  const cropping = shot === "medium" || shot === "close-up" || shot === "extreme-close-up";
  const fit = cropping || overhead || units === 0 ? 1 : Math.min(1, (W * 0.9) / (units * SHOT_SCALE[shot]! * H * angleScale));
  const h = SHOT_SCALE[shot]! * H * angleScale * fit;
  const r = h * 0.075;
  const headTop =
    shot === "medium" ? H * 0.12 : shot === "close-up" ? H * 0.42 - r : shot === "extreme-close-up" ? H * 0.5 - r : null;
  const groundBase =
    shot === "extreme-wide" ? horizon + (H - horizon) * 0.3 : shot === "wide" ? horizon + (H - horizon) * 0.55 : angle === "high" ? H * 0.84 : H * 0.93;
  const base = headTop !== null ? headTop + h : overhead ? H * 0.62 : groundBase;
  const backScale = 1 / Math.pow(spread, 0.8);
  const bokeh = (state.lens === "85" || state.lens === "135") && (shot === "medium" || shot === "close-up" || shot === "extreme-close-up");

  // Lay actors out by their real widths so cars and horses don't pile onto people.
  const widths = actors.map((a) => (ACTOR_WIDTH[a.item.glyph] ?? 0.45) * h);
  const pad = 0.15 * h;
  const total = widths.reduce((sum, w) => sum + w, 0) + pad * Math.max(actors.length - 1, 0);
  const startX = state.composition === "thirds" ? W / 3 - (widths[0] ?? 0) / 2 : W / 2 - total / 2;
  const xs: number[] = [];
  widths.reduce((cursor, w) => {
    xs.push(cursor + w / 2);
    return cursor + w + pad;
  }, startX);
  const main = actors[0];
  const mainX = xs[0] ?? W / 2;
  const mainIsFigure = main && (main.item.glyph === "person" || main.item.glyph === "child" || main.item.glyph === "robot");
  const bust = shot === "close-up" || shot === "extreme-close-up";

  const labels = new Map<string, { x: number; y: number; text: string }>();
  const label = (item: SketchItem, x: number, y: number) => {
    if (!labels.has(item.label)) labels.set(item.label, { x, y: Math.min(y, H - 18), text: item.count > 1 ? `${item.label} ×${item.count}` : item.label });
  };

  const frontNodes: ReactNode[] = [];
  const backNodes: ReactNode[] = [];
  const skyNodes: ReactNode[] = [];

  if (overhead) {
    // Top-down: footprints around the subject, backdrops round the edges.
    const u = H * 0.07 * (TOP_SCALE[shot] ?? 1);
    const backs = uniqueByGlyph(scene.items.filter((i) => i.layer === "back")).flatMap((item) => Array.from({ length: Math.min(item.count, 4) }, (_, k) => ({ item, k })));
    const tops = [...instances, ...backs];
    const edge = [[0.16, 0.2], [0.84, 0.22], [0.14, 0.84], [0.86, 0.82], [0.5, 0.1], [0.5, 0.92], [0.07, 0.5], [0.93, 0.5]] as const;
    let e = 0;
    tops.forEach(({ item, k }, i) => {
      const isBack = item.layer === "back";
      const idx = actors.findIndex((a) => a.item === item && a.k === k);
      let x: number;
      let y: number;
      if (isBack) {
        const spot = edge[e++ % edge.length]!;
        x = spot[0] * W;
        y = spot[1] * H;
      } else if (idx >= 0) {
        x = xs[idx]! * 0.9 + W * 0.05;
        y = H * 0.52;
      } else {
        x = mainX + (i % 2 ? -1 : 1) * u * (1.8 + i * 0.4);
        y = H * 0.52 + u * 1.6;
      }
      frontNodes.push(<g key={`t${i}`}>{topGlyph(item.glyph, x, y, u, c, idx === 0)}</g>);
      label(item, x, y + u * (isBack ? 1.6 : 1.2) + 18);
    });
    held.forEach((item, i) => {
      frontNodes.push(<g key={`th${i}`}>{heldGlyph(item.glyph, mainX + u * (0.9 + i * 0.7), H * 0.52 + u * 0.3, u * 0.6, c)}</g>);
      label(item, mainX + u * (1.2 + i * 0.7), H * 0.52 + u * 1.3);
    });
  } else {
    const hasTable = furniture.some((f) => f.item.glyph === "table");
    furniture.forEach(({ item, k }, i) => {
      const size = (FRONT_SIZE[item.glyph] ?? 0.4) * h;
      let x = mainX + (i % 2 ? -1 : 1) * ((xs.length > 1 ? total / 2 : 0.3 * h) + 0.3 * h + k * size * 1.4 + Math.floor(i / 2) * 0.3 * h);
      if (item.glyph === "chair" && scene.pose === "sit") x = mainX - 0.05 * h;
      if (item.glyph === "bed" && scene.pose === "lie") x = mainX + 0.3 * h;
      if (item.glyph === "flower") x = mainX + (k - 1) * 0.25 * h - 0.6 * h;
      const b = item.glyph === "bed" && scene.pose === "lie" ? base + 0.25 * h : base;
      frontNodes.push(<g key={`f${i}`}>{frontGlyph(item.glyph, x, b, size, c, false)}</g>);
      label(item, x, b + 30);
    });
    actors.forEach(({ item }, idx) => {
      const x = xs[idx]!;
      const isMain = idx === 0;
      const pose = scene.pose;
      const figureBase = pose === "lie" && furniture.some((f) => f.item.glyph === "bed") ? base - 0.2 * h : base;
      if (item.glyph === "person" || item.glyph === "child" || item.glyph === "robot") {
        const fh = item.glyph === "child" ? h * 0.65 : h;
        frontNodes.push(<g key={`a${idx}`}>{figure(x, figureBase, fh, pose, c, isMain, item.glyph === "robot", bust)}</g>);
      } else {
        const size = (FRONT_SIZE[item.glyph] ?? 0.4) * h;
        const b = item.glyph === "fish" && scene.water ? horizon + (H - horizon) * 0.2 : base;
        frontNodes.push(<g key={`a${idx}`}>{frontGlyph(item.glyph, x, b, size, c, isMain)}</g>);
      }
      label(item, x, figureBase + 30);
    });
    held.forEach((item, i) => {
      // Close-ups: props rise into frame beside the face.
      const faceY = base - h + r;
      const big = item.glyph === "sword" || item.glyph === "guitar";
      const s = bust ? r * (big ? 2.4 : 1.1) : h * (big ? 0.45 : item.glyph === "candle" ? 0.16 : 0.1);
      const pos = bust
        ? { x: mainX + r * (1.8 + i * 1.3), y: faceY + r * 1.6 }
        : hasTable
          ? { x: mainX + 0.45 * h + (i - 0.5) * 0.18 * h, y: base - 0.42 * h }
          : mainIsFigure
            ? handOf(mainX, base, h, scene.pose)
            : { x: mainX + (i + 1) * 0.3 * h, y: base };
      frontNodes.push(<g key={`h${i}`}>{heldGlyph(item.glyph, pos.x + (bust ? 0 : i * 0.05 * h), pos.y + (bust ? 0 : s * 0.4), s, c)}</g>);
      label(item, pos.x, pos.y + (bust ? 30 : s + 26));
    });

    // Back layer along the horizon.
    const backSlots = [0.78, 0.2, 0.92, 0.06, 0.6, 0.38];
    const backSize: Partial<Record<Glyph, number>> = { house: 0.2, tower: 0.34, lighthouse: 0.42, castle: 0.3, city: 0.26, tree: 0.24, palm: 0.3, mountain: 0.36, hill: 0.2, window: 0.3, door: 0.36 };
    let slot = 0;
    uniqueByGlyph(scene.items.filter((i) => i.layer === "back")).forEach((item) => {
      const n = item.glyph === "tree" || item.glyph === "palm" ? Math.max(item.count, item.label === "forest" || item.label === "woods" ? 4 : 1) : item.count;
      for (let k = 0; k < Math.min(n, 4); k++) {
        const x = (backSlots[slot % backSlots.length]! + (slot >= backSlots.length ? 0.04 : 0)) * W;
        slot++;
        const s = (backSize[item.glyph] ?? 0.25) * H * backScale;
        const wallItem = scene.interior && (item.glyph === "window" || item.glyph === "door");
        const b = wallItem ? (item.glyph === "door" ? horizon : horizon - 0.08 * H) : horizon + (scene.water ? 0 : 4);
        backNodes.push(<g key={`b${item.label}${k}`}>{backGlyph(item.glyph, x, b, s, c, scene.interior)}</g>);
        if (k === 0) label(item, x, b + 26);
      }
    });

    // Sky layer.
    const skyTop = Math.max(horizon, H * 0.25);
    const rand = rng(7);
    scene.items
      .filter((i) => i.layer === "sky")
      .forEach((item, i) => {
        if (item.glyph === "star") {
          for (let k = 0; k < 14; k++) skyNodes.push(<g key={`s${k}`}>{skyGlyph("star", rand() * W, rand() * skyTop * 0.85, 14 + rand() * 14, c, k)}</g>);
          label(item, W * 0.5, skyTop * 0.2);
          return;
        }
        const spots = { sun: [0.76, 0.3], moon: [0.78, 0.26], planet: [0.22, 0.24], cloud: [0.35, 0.22], bird: [0.55, 0.2], plane: [0.4, 0.14] } as Record<string, [number, number]>;
        const setting = item.glyph === "sun" && (state.lighting === "golden-hour" || /sunset|sunrise|dusk|dawn/.test(item.label));
        // A setting sun sinks behind the horizon, centred behind the subject.
        const [fx, fy] = setting ? [0.5, 0] : (spots[item.glyph] ?? [0.5, 0.2]);
        const size = item.glyph === "bird" ? 40 : item.glyph === "cloud" ? 110 : item.glyph === "plane" ? 90 : setting ? 150 : 80;
        const y = setting ? horizon : fy * skyTop;
        for (let k = 0; k < Math.min(item.count, 5); k++) {
          skyNodes.push(<g key={`k${i}${k}`}>{skyGlyph(item.glyph, fx * W + k * size * 1.3, y + (k % 2) * size * 0.4, size, c, k)}</g>);
        }
        label(item, fx * W + size * 0.9, setting ? horizon - size * 0.8 : y + size * 0.9 + 18);
      });
  }

  // Ground: perspective lines from the vanishing point, spread by lens.
  const vx = W / 2;
  const floorLines = Array.from({ length: 13 }, (_, i) => (i - 6) * (W / 5) * spread);
  const groundFill = scene.interior ? pal.secondary : pal.primary;

  const lighting = state.lighting;
  const shotLabel = findOption(shotOptions, state.shot)?.label;
  const hud = [
    state.aspect,
    state.shot !== "auto" && shotLabel,
    state.angle !== "auto" && findOption(angleOptions, state.angle)?.label,
    state.lens !== "auto" && findOption(lensOptions, state.lens)?.label.split(" ")[0],
  ].filter(Boolean).join(" · ");
  const film = [state.genre !== "auto" && findOption(genreOptions, state.genre)?.label, state.era !== "auto" && findOption(eraOptions, state.era)?.label].filter(Boolean).join(" · ");
  const empty = scene.items.length === 0 && layers.length === 0;
  const hudInk = c.ink;
  // Text reads at a similar size whether the frame is tall or wide.
  const fs = Math.round(Math.min(Math.max(14 + 10 * (H / W), 18), 32));
  const font = { fontFamily: "var(--font-mono)", fontSize: fs };
  // Nudge labels up until they clear the ones already placed (mono glyphs are ~0.6em wide).
  const placed: { x: number; y: number; text: string }[] = [];
  const layerLabels = layers.map((l) => ({ x: l.x * W, y: l.y * H + (LAYER_HEIGHT[l.glyph] * l.scale * H) / 2 + fs * 1.3, text: l.label }));
  [...layerLabels, ...labels.values()].forEach((l) => {
    l.x = Math.min(Math.max(l.x, 80), W - 80);
    const clash = () => placed.some((p) => Math.abs(p.x - l.x) < 0.3 * fs * (p.text.length + l.text.length) + fs * 0.5 && Math.abs(p.y - l.y) < fs * 1.2);
    for (let tries = 0; clash() && tries < 6; tries++) l.y -= fs * 1.3;
    placed.push(l);
  });

  // ——— Layer editing: drag to move, corner to scale, top handle to rotate ———
  const editable = Boolean(onLayerChange);
  const toLocal = (e: PointerEvent) => {
    const m = layersRef.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  /** "two dogs" draws two dogs side by side inside one layer. */
  const copies = (l: Layer) => Math.max(1, l.count ?? 1);
  const sizeOf = (l: Layer) => {
    const hh = LAYER_HEIGHT[l.glyph] * l.scale * H;
    const one = hh * LAYER_ASPECT[l.glyph];
    return { hh, one, ww: one * copies(l) + one * 0.15 * (copies(l) - 1) };
  };
  const begin = (e: PointerEvent, mode: Drag["mode"], l: Layer) => {
    if (!editable) return;
    e.stopPropagation();
    (e.currentTarget as Element).closest("svg")?.setPointerCapture(e.pointerId);
    onSelect?.(l.id);
    drag.current = { mode, id: l.id, start: toLocal(e), layer: l };
  };
  const lookable = Boolean(onView) && !flat;
  const startView = (e: PointerEvent) => {
    if (!lookable || e.button === 1) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    viewDrag.current = { kind: e.shiftKey || e.button === 2 || viewTool === "pan" ? "pan" : "orbit", x: e.clientX, y: e.clientY };
  };
  const onMove = (e: PointerEvent) => {
    const v = viewDrag.current;
    if (v && onView) {
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      onView(v.kind, (e.clientX - v.x) / rect.width, (e.clientY - v.y) / rect.height);
      v.x = e.clientX;
      v.y = e.clientY;
      return;
    }
    const d = drag.current;
    if (!d || !onLayerChange) return;
    const p = toLocal(e);
    const cx = d.layer.x * W;
    const cy = d.layer.y * H;
    if (d.mode === "move") {
      onLayerChange(d.id, { x: clamp(d.layer.x + (p.x - d.start.x) / W, -0.2, 1.2), y: clamp(d.layer.y + (p.y - d.start.y) / H, -0.2, 1.2) });
    } else if (d.mode === "scale") {
      const before = Math.hypot(d.start.x - cx, d.start.y - cy) || 1;
      onLayerChange(d.id, { scale: clamp((d.layer.scale * Math.hypot(p.x - cx, p.y - cy)) / before, 0.05, 8) });
    } else {
      const delta = (Math.atan2(p.y - cy, p.x - cx) - Math.atan2(d.start.y - cy, d.start.x - cx)) * (180 / Math.PI);
      let rotation = d.layer.rotation + delta;
      if (e.shiftKey) rotation = Math.round(rotation / 15) * 15;
      onLayerChange(d.id, { rotation: Math.round(rotation * 10) / 10 });
    }
  };
  const end = () => {
    drag.current = null;
    viewDrag.current = null;
  };
  const onKey = (e: KeyboardEvent) => {
    const l = layers.find((x) => x.id === selectedId);
    if (!l || !onLayerChange) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, Partial<Layer>> = {
      ArrowLeft: { x: l.x - step },
      ArrowRight: { x: l.x + step },
      ArrowUp: { y: l.y - step },
      ArrowDown: { y: l.y + step },
    };
    if (moves[e.key]) {
      e.preventDefault();
      onLayerChange(l.id, moves[e.key]!);
    } else if ((e.key === "Delete" || e.key === "Backspace") && onLayerDelete) {
      e.preventDefault();
      onLayerDelete(l.id);
    } else if (e.key === "Escape") onSelect?.(null);
  };
  const selected = layers.find((l) => l.id === selectedId);
  const handle = 16;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      tabIndex={editable ? 0 : undefined}
      onPointerDown={
        editable || lookable
          ? (e) => {
              onSelect?.(null);
              startView(e);
            }
          : undefined
      }
      onPointerMove={editable || lookable ? onMove : undefined}
      onPointerUp={editable || lookable ? end : undefined}
      onPointerCancel={editable || lookable ? end : undefined}
      onContextMenu={lookable ? (e) => e.preventDefault() : undefined}
      onKeyDown={editable ? onKey : undefined}
      style={editable || lookable ? { touchAction: "none", cursor: lookable ? (viewTool === "pan" ? "move" : "grab") : undefined } : undefined} className={`block h-auto w-full ${className}`} role="img" aria-label={`Rough sketch: ${[...layers.map((l) => l.label), ...scene.items.map((i) => i.label)].join(", ") || "no recognised subjects yet"}`}>
      <defs>
        <radialGradient id="sb-glow">
          <stop offset="0" stopColor="#FFD27A" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFD27A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sb-golden" x1="0" x2="1">
          <stop offset="0" stopColor="#FF9A3C" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FF9A3C" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sb-vignette">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
        <clipPath id="sb-frame">
          <rect width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#sb-frame)">
        <g transform={!camera && angle === "dutch" ? `rotate(-9 ${W / 2} ${H / 2}) translate(${W / 2} ${H / 2}) scale(1.14) translate(${-W / 2} ${-H / 2})` : undefined}>
          {/* Sky / wall and ground / floor */}
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={pal.bg} />
          {flat ? (
            // 2D board: graph paper, nothing in perspective.
            <g stroke={c.ink}>
              {Array.from({ length: Math.ceil(W / 50) + 1 }, (_, i) => (
                <line key={`gx${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H} strokeOpacity={i % 4 === 0 ? 0.2 : 0.08} strokeWidth={i % 4 === 0 ? 2 : 1.5} />
              ))}
              {Array.from({ length: Math.ceil(H / 50) + 1 }, (_, i) => (
                <line key={`gy${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50} strokeOpacity={i % 4 === 0 ? 0.2 : 0.08} strokeWidth={i % 4 === 0 ? 2 : 1.5} />
              ))}
            </g>
          ) : camera ? (
            // 3D: the real horizon and a perspective ground grid, both from the camera.
            <>
              {skyNodes}
              <rect x={-W} y={Math.max(horizon, -H)} width={W * 3} height={H * 3} fill={pal.bg} />
              <rect x={-W} y={Math.max(horizon, -H)} width={W * 3} height={H * 3} fill={scene.interior ? pal.secondary : pal.primary} fillOpacity={0.35} />
              <path d={groundGrid(camera, W, H)} fill="none" stroke={c.ink} strokeOpacity={0.18} strokeWidth={2} />
              {camHorizon !== null && camHorizon !== undefined && camHorizon > -0.1 && camHorizon < 1.1 && (
                <line x1={-W} y1={horizon} x2={W * 2} y2={horizon} stroke={c.ink} strokeOpacity={0.5} strokeWidth={3} />
              )}
            </>
          ) : overhead ? (
            <g stroke={c.ink} strokeOpacity={0.18} strokeWidth={2}>
              <rect width={W} height={H} fill={groundFill} fillOpacity={0.35} stroke="none" />
              {Array.from({ length: 12 }, (_, i) => (
                <line key={`v${i}`} x1={(i * W) / 11} y1={0} x2={(i * W) / 11} y2={H} />
              ))}
              {Array.from({ length: 16 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={(i * H) / 15} x2={W} y2={(i * H) / 15} />
              ))}
            </g>
          ) : (
            <>
              {skyNodes}
              <rect x={-W} y={horizon} width={W * 3} height={H * 2} fill={pal.bg} />
              <rect x={-W} y={horizon} width={W * 3} height={H * 2} fill={groundFill} fillOpacity={0.35} />
              {scene.water && !scene.interior && (
                <g>
                  <rect x={-W} y={horizon} width={W * 3} height={(H - horizon) * 0.3} fill={pal.secondary} fillOpacity={0.7} />
                  {[0.08, 0.16, 0.24].map((f) => (
                    <path key={f} d={`M0 ${horizon + (H - horizon) * f} ${Array.from({ length: 10 }, () => `q${W / 20} -12 ${W / 10} 0`).join(" ")}`} fill="none" stroke={c.ink} strokeOpacity={0.35} strokeWidth={3} />
                  ))}
                </g>
              )}
              <g stroke={c.ink} strokeOpacity={0.16} strokeWidth={2}>
                {floorLines.map((dx) => (
                  <line key={dx} x1={vx} y1={horizon} x2={vx + dx * 2.2} y2={H * 1.6} />
                ))}
              </g>
              <line x1={-W} y1={horizon} x2={W * 2} y2={horizon} stroke={c.ink} strokeOpacity={0.5} strokeWidth={3} />
            </>
          )}

          {!flat && (
            <>
              <g opacity={bokeh ? 0.5 : 1}>{backNodes}</g>
              {/* Hard flash: a flat shadow behind the figures */}
              {lighting === "hard-flash" && <g transform="translate(18 10)" opacity={0.3}>{frontNodes}</g>}
              {frontNodes}
            </>
          )}
          <g ref={layersRef}>
            {layers.map((l, i) => {
              const { hh, ww, one } = sizeOf(l);
              const n = copies(l);
              const front = i === layers.length - 1;
              return (
                <g
                  key={l.id}
                  transform={`translate(${l.x * W} ${l.y * H}) rotate(${l.rotation}) scale(${l.flip ? -1 : 1} 1)`}
                  onPointerDown={(e) => begin(e, "move", l)}
                  style={editable ? { cursor: "move" } : undefined}
                  aria-label={l.label}
                >
                  <rect x={-ww / 2} y={-hh / 2} width={ww} height={hh} fill="transparent" />
                  {Array.from({ length: n }, (_, k) => (
                    <g key={k} transform={`translate(${(k - (n - 1) / 2) * one * 1.15} 0)`}>
                      {layerGlyph(l.glyph, hh, c, front && k === 0, l.pose ?? "stand", l.facing)}
                    </g>
                  ))}
                </g>
              );
            })}
          </g>

          {/* Light: overlays only, never take the pointer */}
          <g pointerEvents="none">
          {lighting === "golden-hour" && <rect width={W} height={H} fill="url(#sb-golden)" />}
          {lighting === "soft-daylight" && <rect width={W} height={H} fill="#FFFFFF" opacity={0.12} />}
          {lighting === "overcast" && <rect width={W} height={H} fill="#8A8F96" opacity={0.28} />}
          {(lighting === "night" || lighting === "candlelight") && <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="#050818" opacity={lighting === "night" ? 0.45 : 0.55} />}
          {lighting === "candlelight" && <circle cx={mainX + 0.2 * h} cy={base - 0.5 * h} r={Math.max(h * 0.9, 220)} fill="url(#sb-glow)" />}
          {lighting === "backlit" && <circle cx={mainX} cy={Math.min(base - 0.7 * h, horizon)} r={Math.max(h * 0.8, 240)} fill="url(#sb-glow)" />}
          {lighting === "hard-flash" && <circle cx={W / 2} cy={H * 0.45} r={W * 0.45} fill="url(#sb-glow)" opacity={0.6} />}
          {lighting === "studio" && (
            <g fill="#FFFFFF" opacity={0.5}>
              <rect x={W * 0.04} y={H * 0.05} width={W * 0.12} height={H * 0.16} rx={6} />
              <rect x={W * 0.84} y={H * 0.05} width={W * 0.12} height={H * 0.16} rx={6} />
            </g>
          )}
          {lighting === "night" && !scene.items.some((i) => i.glyph === "moon") && !overhead && skyGlyph("moon", W * 0.8, Math.max(horizon * 0.3, 120), 70, c, 0)}
          {(state.lens === "14" || state.lens === "24") && <rect width={W} height={H} fill="url(#sb-vignette)" />}

          </g>
          {/* Labels */}
          <g {...font} textAnchor="middle" fill={c.ink} stroke={pal.bg} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round" pointerEvents="none">
            {placed.map((l, i) => (
              <text key={`${i}${l.text}`} x={l.x} y={l.y}>
                {l.text}
              </text>
            ))}
          </g>
          {selected &&
            (() => {
              const { hh, ww } = sizeOf(selected);
              const a = (selected.rotation * Math.PI) / 180;
              const at = (lx: number, ly: number) => ({ x: selected.x * W + lx * Math.cos(a) - ly * Math.sin(a), y: selected.y * H + lx * Math.sin(a) + ly * Math.cos(a) });
              const corners = [at(-ww / 2, -hh / 2), at(ww / 2, -hh / 2), at(ww / 2, hh / 2), at(-ww / 2, hh / 2)];
              const top = at(0, -hh / 2);
              const knob = at(0, -hh / 2 - 60);
              return (
                <g>
                  <polygon points={corners.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#3B82F6" strokeWidth={3} strokeDasharray="10 6" />
                  <line x1={top.x} y1={top.y} x2={knob.x} y2={knob.y} stroke="#3B82F6" strokeWidth={3} />
                  <circle cx={selected.x * W} cy={selected.y * H} r={7} fill="none" stroke="#3B82F6" strokeWidth={3} />
                  {corners.map((p, i) => (
                    <rect
                      key={i}
                      x={p.x - handle / 2}
                      y={p.y - handle / 2}
                      width={handle}
                      height={handle}
                      fill="#FFFFFF"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      style={{ cursor: "nwse-resize" }}
                      onPointerDown={(e) => begin(e, "scale", selected)}
                    >
                      <title>Drag to scale</title>
                    </rect>
                  ))}
                  <circle cx={knob.x} cy={knob.y} r={handle * 0.75} fill="#FFFFFF" stroke="#3B82F6" strokeWidth={3} style={{ cursor: "grab" }} onPointerDown={(e) => begin(e, "rotate", selected)}>
                    <title>Drag to rotate (Shift snaps to 15°)</title>
                  </circle>
                </g>
              );
            })()}
        </g>

        {/* Framing grid and notes (not rotated); they never take the pointer */}
        <g pointerEvents="none">
        <g stroke={hudInk} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 10">
          <line x1={W / 3} y1={0} x2={W / 3} y2={H} />
          <line x1={(2 * W) / 3} y1={0} x2={(2 * W) / 3} y2={H} />
          <line x1={0} y1={H / 3} x2={W} y2={H / 3} />
          <line x1={0} y1={(2 * H) / 3} x2={W} y2={(2 * H) / 3} />
        </g>
        <g stroke={hudInk} strokeOpacity={0.6} strokeWidth={3} fill="none">
          <path d={`M20 60 V20 H60 M${W - 60} 20 H${W - 20} V60 M${W - 20} ${H - 60} V${H - 20} H${W - 60} M60 ${H - 20} H20 V${H - 60}`} />
          <path d={`M${W / 2 - 14} ${H / 2} h28 M${W / 2} ${H / 2 - 14} v28`} />
        </g>
        <g {...font} fill={hudInk} stroke={pal.bg} strokeWidth={6} paintOrder="stroke">
          <text x={36} y={36 + fs}>{hud}</text>
          <text x={36} y={36 + fs * 2.3} fontSize={fs * 0.75} opacity={0.8}>
            ROUGH SKETCH{keepComposition ? " · COMPOSITION FROM YOUR SOURCE" : ""}
          </text>
          {film && (
            <text x={W - 36} y={36 + fs} textAnchor="end">
              {film}
            </text>
          )}
        </g>
        <g>
          {[pal.bg, pal.primary, pal.secondary, pal.accent].map((hex, i) => (
            <rect key={i} x={W - 36 - (4 - i) * fs * 1.25} y={36 + fs * (film ? 1.6 : 0.2)} width={fs} height={fs} fill={hex} stroke={hudInk} strokeOpacity={0.5} strokeWidth={2} />
          ))}
        </g>
        </g>
        {empty && (
          <g {...font} textAnchor="middle" fill={hudInk} stroke={pal.bg} strokeWidth={6} paintOrder="stroke">
            <text x={W / 2} y={H / 2 - 50} fontSize={30}>
              {state.subject.trim() ? "Nothing to sketch yet" : state.task === "restyle" ? "Your source image" : "Type a subject to sketch it"}
            </text>
            <text x={W / 2} y={H / 2 - 12} opacity={0.8}>
              {state.subject.trim() ? "Try simple nouns: woman, dog, car, tree, moon…" : "e.g. two dancers on a beach at sunset"}
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
