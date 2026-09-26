import { getPalette } from "../../content/palettes";
import { getStyle, styles } from "../../content/styles";
import type { Hex, PaletteSize } from "../../content/types";
import { normaliseHex } from "../color";
import {
  aspectOptions,
  cameraOptions,
  compositionOptions,
  durationOptions,
  intensities,
  lightingOptions,
  movementOptions,
  outputs,
  paletteModes,
  preserveOptions,
  tasks,
  type AspectId,
  type CameraId,
  type CompositionId,
  type Duration,
  type Intensity,
  type LightingId,
  type MovementId,
  type Output,
  type PaletteMode,
  type PreserveId,
  type Task,
} from "./options";

export interface BuilderState {
  style: string;
  output: Output;
  task: Task;
  subject: string;
  intensity: Intensity;
  paletteMode: PaletteMode;
  count: PaletteSize;
  /** Curated palette slug (used when paletteMode === "curated"). */
  palette: string | null;
  /** Always four slots; only the first `count` are used. */
  custom: [Hex, Hex, Hex, Hex];
  composition: CompositionId;
  aspect: AspectId;
  lighting: LightingId;
  preserve: PreserveId[];
  duration: Duration;
  camera: CameraId;
  movement: MovementId;
}

export const SUBJECT_MAX = 400;

const firstStyle = styles[0]!;

export function defaultState(): BuilderState {
  return {
    style: firstStyle.slug,
    output: "image",
    task: "create",
    subject: "",
    intensity: "balanced",
    paletteMode: "style",
    count: 3,
    palette: null,
    custom: firstStyle.swatches.map((s) => s.hex) as [Hex, Hex, Hex, Hex],
    composition: "style",
    aspect: "4:5",
    lighting: "style",
    preserve: ["identity", "composition"],
    duration: 6,
    camera: "push-in",
    movement: "subtle",
  };
}

/** Trim, collapse whitespace, strip control characters and cap length. */
export function cleanSubject(input: string): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUBJECT_MAX);
}

// ——— URL codec ———

const KEYS = {
  style: "s",
  output: "o",
  task: "t",
  subject: "q",
  intensity: "i",
  paletteMode: "pm",
  count: "n",
  palette: "p",
  custom: "c",
  composition: "cm",
  aspect: "ar",
  lighting: "l",
  preserve: "k",
  duration: "d",
  camera: "cam",
  movement: "mv",
} as const;

/** Only non-default values are written, keeping share links short. */
export function encodeState(state: BuilderState): URLSearchParams {
  const d = defaultState();
  const q = new URLSearchParams();
  const put = (key: string, value: string, def: string) => {
    if (value !== def) q.set(key, value);
  };
  q.set(KEYS.style, state.style);
  put(KEYS.output, state.output, d.output);
  put(KEYS.task, state.task, d.task);
  if (state.subject) q.set(KEYS.subject, state.subject);
  put(KEYS.intensity, state.intensity, d.intensity);
  put(KEYS.paletteMode, state.paletteMode, d.paletteMode);
  put(KEYS.count, String(state.count), String(d.count));
  if (state.paletteMode === "curated" && state.palette) q.set(KEYS.palette, state.palette);
  if (state.paletteMode === "custom")
    q.set(KEYS.custom, state.custom.slice(0, state.count).map((h) => h.slice(1)).join("-"));
  put(KEYS.composition, state.composition, d.composition);
  put(KEYS.aspect, state.aspect, d.aspect);
  put(KEYS.lighting, state.lighting, d.lighting);
  if (state.task === "restyle") put(KEYS.preserve, state.preserve.join("-"), d.preserve.join("-"));
  if (state.output === "video") {
    put(KEYS.duration, String(state.duration), String(d.duration));
    put(KEYS.camera, state.camera, d.camera);
    put(KEYS.movement, state.movement, d.movement);
  }
  return q;
}

export interface DecodeResult {
  state: BuilderState;
  /** Human-readable notes about values that were ignored. */
  issues: string[];
}

const ids = <T extends { id: unknown }>(list: readonly T[]) => list.map((o) => String(o.id));

/**
 * Restores a builder configuration from query parameters. Unknown or
 * malformed values fall back to defaults and are reported in `issues`.
 */
export function decodeState(params: URLSearchParams): DecodeResult {
  const state = defaultState();
  const issues: string[] = [];

  const pick = <T extends string>(key: string, allowed: readonly string[], label: string): T | undefined => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    if (allowed.includes(raw)) return raw as T;
    issues.push(`${label} “${raw.slice(0, 40)}” isn’t recognised, so the default was used.`);
    return undefined;
  };

  const styleSlug = params.get(KEYS.style);
  if (styleSlug !== null) {
    const style = getStyle(styleSlug);
    if (style) {
      state.style = style.slug;
      state.custom = style.swatches.map((s) => s.hex) as BuilderState["custom"];
    } else issues.push(`Style “${styleSlug.slice(0, 40)}” wasn’t found, so the first style was selected.`);
  }

  state.output = pick<Output>(KEYS.output, outputs, "Output") ?? state.output;
  state.task = pick<Task>(KEYS.task, tasks, "Task") ?? state.task;
  const subject = params.get(KEYS.subject);
  if (subject !== null) state.subject = cleanSubject(subject);
  state.intensity = pick<Intensity>(KEYS.intensity, intensities, "Intensity") ?? state.intensity;
  state.paletteMode = pick<PaletteMode>(KEYS.paletteMode, paletteModes, "Palette mode") ?? state.paletteMode;

  const count = pick<"2" | "3" | "4">(KEYS.count, ["2", "3", "4"], "Colour count");
  if (count) state.count = Number(count) as PaletteSize;

  const paletteSlug = params.get(KEYS.palette);
  if (paletteSlug !== null) {
    const pal = getPalette(paletteSlug);
    if (pal) {
      state.palette = pal.slug;
      if (!params.has(KEYS.paletteMode)) state.paletteMode = "curated";
      state.count = pal.colours.length as PaletteSize;
    } else {
      issues.push(`Palette “${paletteSlug.slice(0, 40)}” wasn’t found.`);
    }
  }
  if (state.paletteMode === "curated" && !state.palette) {
    state.paletteMode = "style";
    if (paletteSlug === null) issues.push("No curated palette was specified, so the style’s colours are used.");
  }

  const custom = params.get(KEYS.custom);
  if (custom !== null) {
    const hexes = custom.split(/[-,]/).map((h) => normaliseHex(h));
    if (hexes.length >= 2 && hexes.length <= 4 && hexes.every(Boolean)) {
      hexes.forEach((h, i) => (state.custom[i] = h as Hex));
      if (!params.has(KEYS.count)) state.count = hexes.length as PaletteSize;
      if (!params.has(KEYS.paletteMode)) state.paletteMode = "custom";
    } else {
      issues.push("The custom colours in this link aren’t valid hex values, so the style’s colours are used.");
      if (state.paletteMode === "custom") state.paletteMode = "style";
    }
  }

  state.composition = pick<CompositionId>(KEYS.composition, ids(compositionOptions), "Composition") ?? state.composition;
  state.aspect = pick<AspectId>(KEYS.aspect, ids(aspectOptions), "Aspect ratio") ?? state.aspect;
  state.lighting = pick<LightingId>(KEYS.lighting, ids(lightingOptions), "Lighting") ?? state.lighting;

  const preserve = params.get(KEYS.preserve);
  if (preserve !== null) {
    const allowed = ids(preserveOptions);
    const parts = preserve.split(/[-,]/).filter(Boolean);
    const valid = parts.filter((p) => allowed.includes(p)) as PreserveId[];
    if (valid.length !== parts.length) issues.push("Some “preserve” options in this link weren’t recognised.");
    state.preserve = [...new Set(valid)];
  }

  const duration = pick<string>(KEYS.duration, ids(durationOptions), "Duration");
  if (duration) state.duration = Number(duration) as Duration;
  state.camera = pick<CameraId>(KEYS.camera, ids(cameraOptions), "Camera movement") ?? state.camera;
  state.movement = pick<MovementId>(KEYS.movement, ids(movementOptions), "Subject movement") ?? state.movement;

  return { state, issues };
}
