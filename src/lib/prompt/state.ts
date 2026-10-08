import { getPalette } from "../../content/palettes";
import { getStyle, styles } from "../../content/styles";
import { CUSTOM_SLUG, CUSTOM_STYLE_MAX, customStyle, getCustomTemplate, type CustomStyleSpec } from "../../content/styles/custom";
import { getTemplate, isTemplateFormat, textSlots } from "../../content/templates";
import type { Hex, PaletteSize, StyleRecord, TemplateFormat } from "../../content/types";
import { normaliseHex } from "../color";
import { shotCamera } from "../scene/camera";
import { actorFromLayer } from "../scene/convert";
import { decodeActors, encodeActors, type Actor } from "../scene/model";
import { decodeLayers } from "../sketch/layers";
import {
  angleOptions,
  aspectOptions,
  cameraOptions,
  compositionOptions,
  durationOptions,
  eraOptions,
  genreOptions,
  intensities,
  legacyCompositions,
  lensOptions,
  lightingOptions,
  movementOptions,
  outputs,
  paletteModes,
  preserveOptions,
  shotOptions,
  tasks,
  type AngleId,
  type AspectId,
  type CameraId,
  type CompositionId,
  type Duration,
  type EraId,
  type GenreId,
  type Intensity,
  type LensId,
  type LightingId,
  type MovementId,
  type Output,
  type PaletteMode,
  type PreserveId,
  type ShotId,
  type Task,
} from "./options";

export interface BuilderState {
  /** A catalogue slug, or CUSTOM_SLUG for the visitor's own description. */
  style: string;
  /** The visitor's own style; used only when `style` is CUSTOM_SLUG. */
  customStyle: CustomStyleSpec;
  output: Output;
  task: Task;
  subject: string;
  /** Exact words to letter into the image, e.g. a title. Empty for none. */
  text: string;
  intensity: Intensity;
  paletteMode: PaletteMode;
  count: PaletteSize;
  /** Curated palette slug (used when paletteMode === "curated"). */
  palette: string | null;
  /** Always four slots; only the first `count` are used. */
  custom: [Hex, Hex, Hex, Hex];
  composition: CompositionId;
  shot: ShotId;
  angle: AngleId;
  lens: LensId;
  genre: GenreId;
  era: EraId;
  aspect: AspectId;
  lighting: LightingId;
  preserve: PreserveId[];
  duration: Duration;
  camera: CameraId;
  movement: MovementId;
  /** Subjects placed in the 3D scene. */
  actors: Actor[];
  /** 3D: the sketch you can look around. 2D: a flat grid board. */
  view: "3d" | "2d";
  /** Where the 3D view has been turned (degrees), tilted (degrees) and panned (metres). */
  orbit: { yaw: number; tilt: number; panX: number; panY: number };
  /** Numbered notes pinned to the preview ("make the boat an old pirate ship"), in order. */
  comments: Comment[];
  /** What the image is for (a poster, a thumbnail…), or none; sets the frame and a line in the prompt. */
  format: TemplateFormat | null;
  /** A design template of the style (content/templates.ts), or none. */
  template: TemplateFormat | null;
  /** The visitor's words for the template's text blocks, by block id; missing ones use the sample. */
  templateText: Record<string, string>;
}

/** A note pinned to a point of the preview; x and y are fractions of the frame from the top left. */
export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
}

export const MAX_COMMENTS = 12;
export const COMMENT_MAX = 200;

export const SUBJECT_MAX = 400;
/** Matches the longest name a subject on the sketch can have, so placed text is never cut. */
export const TEXT_MAX = 80;
/** The text box holds several lines of copy (a headline, services, an address…), each lettered as its own block. */
export const COPY_MAX = 600;
export const COPY_LINES = 12;
const COPY_LINE_MAX = 120;

const firstStyle = styles[0]!;

export function defaultState(): BuilderState {
  return {
    style: firstStyle.slug,
    customStyle: { template: null, text: "" },
    output: "image",
    task: "create",
    subject: "",
    text: "",
    intensity: "balanced",
    paletteMode: "style",
    count: 3,
    palette: null,
    custom: firstStyle.swatches.map((s) => s.hex) as [Hex, Hex, Hex, Hex],
    composition: "style",
    shot: "auto",
    angle: "auto",
    lens: "auto",
    genre: "auto",
    era: "auto",
    aspect: "4:5",
    lighting: "style",
    preserve: ["identity", "composition"],
    duration: 6,
    camera: "push-in",
    movement: "subtle",
    actors: [],
    view: "2d",
    orbit: { yaw: 0, tilt: 0, panX: 0, panY: 0 },
    comments: [],
    format: null,
    template: null,
    templateText: {},
  };
}

/** Trim, collapse whitespace, strip control characters and cap length. */
export function cleanSubject(input: string, max = SUBJECT_MAX): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Words for a template's text block; ~ and | separate share-link fields. */
export const cleanSlot = (input: string) => cleanSubject(input.replace(/[~|]/g, " "), TEXT_MAX);

/** A comment's words; ~ and | separate share-link fields. */
export const cleanComment = (input: string) => cleanSubject(input.replace(/[~|]/g, " "), COMMENT_MAX);

/** The same cleaning for the text to letter, with its own cap. */
export const cleanText = (input: string) => cleanSubject(input, TEXT_MAX);

/** The text box's lines, each cleaned, blanks dropped, capped in number and in total length. */
export function copyLines(input: string): string[] {
  const lines: string[] = [];
  let total = 0;
  for (const raw of input.split(/\r?\n/)) {
    const line = cleanSubject(raw, COPY_LINE_MAX);
    if (!line) continue;
    if (lines.length >= COPY_LINES || total + line.length + lines.length > COPY_MAX) break;
    lines.push(line);
    total += line.length;
  }
  return lines;
}

/** The text box as stored: its cleaned lines, one per line. */
export const cleanCopy = (input: string) => copyLines(input).join("\n");

/** The style record in use: a catalogue style, or one built from the visitor's description. */
export function styleFor(state: Pick<BuilderState, "style" | "customStyle">): StyleRecord {
  if (state.style === CUSTOM_SLUG) return customStyle(state.customStyle);
  return getStyle(state.style) ?? firstStyle;
}

// ——— URL codec ———

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const KEYS = {
  style: "s",
  customText: "cs",
  customTemplate: "ct",
  output: "o",
  task: "t",
  subject: "q",
  text: "tx",
  intensity: "i",
  paletteMode: "pm",
  count: "n",
  palette: "p",
  custom: "c",
  composition: "cm",
  shot: "sh",
  angle: "an",
  lens: "ln",
  genre: "g",
  era: "er",
  aspect: "ar",
  lighting: "l",
  preserve: "k",
  duration: "d",
  camera: "cam",
  movement: "mv",
  actors: "sc",
  view: "vw",
  orbit: "ob",
  /** Older links: flat 2D layers, converted to the 3D scene on load. */
  layers: "ly",
  format: "fm",
  comments: "nt",
  template: "tp",
  templateText: "tt",
} as const;

/** Only non-default values are written, keeping share links short. */
export function encodeState(state: BuilderState): URLSearchParams {
  const d = defaultState();
  const q = new URLSearchParams();
  const put = (key: string, value: string, def: string) => {
    if (value !== def) q.set(key, value);
  };
  q.set(KEYS.style, state.style);
  if (state.style === CUSTOM_SLUG) {
    if (state.customStyle.template) q.set(KEYS.customTemplate, state.customStyle.template);
    if (state.customStyle.text) q.set(KEYS.customText, state.customStyle.text);
  }
  put(KEYS.output, state.output, d.output);
  put(KEYS.task, state.task, d.task);
  if (state.subject) q.set(KEYS.subject, state.subject);
  if (state.text) q.set(KEYS.text, state.text);
  put(KEYS.intensity, state.intensity, d.intensity);
  put(KEYS.paletteMode, state.paletteMode, d.paletteMode);
  put(KEYS.count, String(state.count), String(d.count));
  if (state.paletteMode === "curated" && state.palette) q.set(KEYS.palette, state.palette);
  if (state.paletteMode === "custom")
    q.set(KEYS.custom, state.custom.slice(0, state.count).map((h) => h.slice(1)).join("-"));
  put(KEYS.composition, state.composition, d.composition);
  put(KEYS.shot, state.shot, d.shot);
  put(KEYS.angle, state.angle, d.angle);
  put(KEYS.lens, state.lens, d.lens);
  put(KEYS.genre, state.genre, d.genre);
  put(KEYS.era, state.era, d.era);
  put(KEYS.aspect, state.aspect, d.aspect);
  put(KEYS.lighting, state.lighting, d.lighting);
  if (state.task === "restyle") put(KEYS.preserve, state.preserve.join("-"), d.preserve.join("-"));
  if (state.actors.length) q.set(KEYS.actors, encodeActors(state.actors));
  if (state.view === "3d") q.set(KEYS.view, "3d");
  if (state.format) q.set(KEYS.format, state.format);
  const notes = state.comments.map((c) => ({ ...c, text: cleanComment(c.text) })).filter((c) => c.text).slice(0, MAX_COMMENTS);
  if (notes.length) q.set(KEYS.comments, notes.map((c) => `${round3(c.x)}~${round3(c.y)}~${c.text}`).join("|"));
  if (state.template) {
    q.set(KEYS.template, state.template);
    const words = Object.entries(state.templateText).filter(([, v]) => v.trim());
    if (words.length) q.set(KEYS.templateText, words.map(([id, v]) => `${id}~${cleanSlot(v)}`).join("|"));
  }
  const o = state.orbit;
  if (o.yaw || o.tilt || o.panX || o.panY) q.set(KEYS.orbit, [o.yaw, o.tilt, o.panX, o.panY].map((n) => Math.round(n * 100) / 100).join("~"));
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
  if (styleSlug === CUSTOM_SLUG) {
    const template = params.get(KEYS.customTemplate);
    if (template !== null && !getCustomTemplate(template)) issues.push(`The custom style template “${template.slice(0, 20)}” isn’t recognised.`);
    state.style = CUSTOM_SLUG;
    state.customStyle = { template: getCustomTemplate(template)?.id ?? null, text: cleanSubject(params.get(KEYS.customText) ?? "", CUSTOM_STYLE_MAX) };
    state.custom = customStyle(state.customStyle).swatches.map((s) => s.hex) as BuilderState["custom"];
  } else if (styleSlug !== null) {
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
  const text = params.get(KEYS.text);
  if (text !== null) state.text = cleanCopy(text);
  state.intensity = pick<Intensity>(KEYS.intensity, intensities, "Intensity") ?? state.intensity;
  state.paletteMode = pick<PaletteMode>(KEYS.paletteMode, paletteModes, "Palette mode") ?? state.paletteMode;

  const count = pick<"1" | "2" | "3" | "4">(KEYS.count, ["1", "2", "3", "4"], "Colour count");
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
    if (hexes.length >= 1 && hexes.length <= 4 && hexes.every(Boolean)) {
      hexes.forEach((h, i) => (state.custom[i] = h as Hex));
      if (!params.has(KEYS.count)) state.count = hexes.length as PaletteSize;
      if (!params.has(KEYS.paletteMode)) state.paletteMode = "custom";
    } else {
      issues.push("The custom colours in this link aren’t valid hex values, so the style’s colours are used.");
      if (state.paletteMode === "custom") state.paletteMode = "style";
    }
  }

  // Older links put shot sizes and angles in the composition field.
  const legacy = legacyCompositions[params.get(KEYS.composition) ?? ""];
  if (legacy) {
    if (legacy.shot) state.shot = legacy.shot;
    if (legacy.angle) state.angle = legacy.angle;
  } else {
    state.composition = pick<CompositionId>(KEYS.composition, ids(compositionOptions), "Composition") ?? state.composition;
  }
  state.shot = pick<ShotId>(KEYS.shot, ids(shotOptions), "Shot size") ?? state.shot;
  state.angle = pick<AngleId>(KEYS.angle, ids(angleOptions), "Camera angle") ?? state.angle;
  state.lens = pick<LensId>(KEYS.lens, ids(lensOptions), "Lens") ?? state.lens;
  state.genre = pick<GenreId>(KEYS.genre, ids(genreOptions), "Genre") ?? state.genre;
  state.era = pick<EraId>(KEYS.era, ids(eraOptions), "Era") ?? state.era;
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

  const format = params.get(KEYS.format);
  if (format !== null) {
    if (isTemplateFormat(format)) state.format = format;
    else issues.push("The format in this link wasn’t recognised, so none is used.");
  }

  const template = params.get(KEYS.template);
  if (template !== null) {
    const t = isTemplateFormat(template) ? getTemplate(state.style, template) : undefined;
    if (t) {
      state.template = t.format;
      const slots = new Set(textSlots(t).map((b) => b.id));
      for (const pair of (params.get(KEYS.templateText) ?? "").split("|")) {
        const [id, ...rest] = pair.split("~");
        const words = cleanSlot(rest.join(" "));
        if (id && slots.has(id) && words) state.templateText[id] = words;
      }
    } else issues.push(`This style has no “${template.slice(0, 20)}” template, so none is used.`);
  }

  const duration = pick<string>(KEYS.duration, ids(durationOptions), "Duration");
  if (duration) state.duration = Number(duration) as Duration;
  state.camera = pick<CameraId>(KEYS.camera, ids(cameraOptions), "Camera movement") ?? state.camera;
  state.movement = pick<MovementId>(KEYS.movement, ids(movementOptions), "Subject movement") ?? state.movement;

  if (params.get(KEYS.view) === "3d") state.view = "3d";
  const orbit = params.get(KEYS.orbit);
  if (orbit !== null) {
    const n = orbit.split("~").map(Number);
    if (n.length === 4 && n.every(Number.isFinite)) {
      const c = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
      state.orbit = { yaw: c(n[0]!, -3600, 3600), tilt: c(n[1]!, -60, 90), panX: c(n[2]!, -200, 200), panY: c(n[3]!, -50, 200) };
    } else issues.push("The saved camera view couldn’t be restored.");
  }

  const actors = params.get(KEYS.actors);
  const layers = params.get(KEYS.layers);
  if (actors !== null) {
    const decoded = decodeActors(actors);
    state.actors = decoded.actors;
    if (decoded.bad) issues.push("Some subjects in the scene couldn’t be restored.");
  } else if (layers !== null) {
    const decoded = decodeLayers(layers);
    const cam = shotCamera(state);
    state.actors = decoded.layers.map((l) => actorFromLayer(cam, l));
    if (decoded.bad) issues.push("Some subjects in the scene couldn’t be restored.");
  }

  const notes = params.get(KEYS.comments);
  if (notes) {
    const unit = (n: number) => Math.min(Math.max(n, 0), 1);
    state.comments = notes
      .split("|")
      .map((part) => part.split("~"))
      .filter(([x, y]) => Number.isFinite(Number(x)) && Number.isFinite(Number(y)))
      .map(([x, y, ...words]) => ({ x: unit(Number(x)), y: unit(Number(y)), text: cleanComment(words.join(" ")) }))
      .filter((c) => c.text)
      .slice(0, MAX_COMMENTS)
      .map((c, i) => ({ id: `n${i}`, ...c }));
  }

  return { state, issues };
}
