import { getPalette } from "../../content/palettes";
import { getStyle, styles } from "../../content/styles";
import type { Hex, PaletteRole, PaletteSize, StyleRecord } from "../../content/types";
import { describeHex } from "../color";
import {
  aspectOptions,
  cameraOptions,
  compositionOptions,
  durationOptions,
  findOption,
  lightingOptions,
  movementOptions,
  preserveOptions,
  type Intensity,
  type PreserveId,
} from "./options";
import { cleanSubject, type BuilderState } from "./state";

export const ROLE_ORDER: Record<PaletteSize, PaletteRole[]> = {
  2: ["background", "primary"],
  3: ["background", "primary", "accent"],
  4: ["background", "primary", "secondary", "accent"],
};

export const DEFAULT_SHARES: Record<PaletteSize, number[]> = {
  2: [70, 30],
  3: [60, 30, 10],
  4: [50, 25, 15, 10],
};

export interface ResolvedColour {
  hex: Hex;
  name: string;
  role: PaletteRole;
  share: number;
}

export interface ResolvedPalette {
  source: "style" | "curated" | "custom";
  label: string;
  colours: ResolvedColour[];
}

/** Works out which colours the builder is currently using. */
export function resolvePalette(state: BuilderState, style: StyleRecord): ResolvedPalette {
  if (state.paletteMode === "curated") {
    const pal = getPalette(state.palette);
    if (pal) return { source: "curated", label: pal.name, colours: pal.colours.map((c) => ({ ...c })) };
  }
  const n = state.count;
  const roles = ROLE_ORDER[n];
  const shares = DEFAULT_SHARES[n];
  if (state.paletteMode === "custom") {
    return {
      source: "custom",
      label: "Custom palette",
      colours: state.custom.slice(0, n).map((hex, i) => ({
        hex,
        name: describeHex(hex),
        role: roles[i]!,
        share: shares[i]!,
      })),
    };
  }
  return {
    source: "style",
    label: `${style.name} colours`,
    colours: style.swatches.slice(0, n).map((sw, i) => ({
      hex: sw.hex,
      name: sw.name,
      role: roles[i]!,
      share: shares[i]!,
    })),
  };
}

const ROLE_PHRASE: Record<PaletteRole, string> = {
  background: "as the background and dominant field",
  primary: "as the primary colour",
  secondary: "as the secondary colour",
  accent: "as a small accent",
};

export function paletteSentence(palette: ResolvedPalette): string {
  const parts = palette.colours.map(
    (c) => `${c.name} (${c.hex}) ${ROLE_PHRASE[c.role]}, about ${c.share}%`,
  );
  return `${parts.join("; ")}. Keep the image within this palette.`;
}

const CUE_COUNT: Record<Intensity, number> = { subtle: 2, balanced: 4, strong: Infinity };

/** "the Bauhaus style", but "the Victorian Style" — never "Style style". */
export function styleRef(name: string): string {
  return /(?:^| )style$/i.test(name) ? `the ${name}` : `the ${name} style`;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const STOP = new Set(["and", "with", "the", "a", "an", "of", "on", "in", "or", "to", "as", "at", "by", "from", "for", "its"]);
const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

/** True when most of `line`'s meaningful words already appear in `seen`. */
function isRedundant(line: string, seen: Set<string>): boolean {
  const w = words(line);
  if (w.length === 0) return true;
  const repeated = w.filter((x) => seen.has(x)).length;
  return repeated / w.length >= 0.6;
}

const COLOUR_WORDS = /colou?r|neon|pastel|saturat|tones?\b|earth|monochrome|palette|primar|jewel|bright|muted|brights/i;
const LIGHT_WORDS = /light|daylight|lighting|moody|dark scenes|night/i;

const TEXT_HINT = /["“”'‘’]|\b(text|title|poster|cover|logo|sign|lettering|headline|typography|word|label|book|album|menu|flyer|banner)\b/i;

export interface ComposeResult {
  prompt: string;
  /** Non-blocking notes shown next to the prompt (not part of it). */
  notes: string[];
}

/**
 * Builds a prompt from the builder state. Pure and deterministic: the same
 * state always yields the same text.
 */
export function composePrompt(state: BuilderState): ComposeResult {
  const style = getStyle(state.style) ?? styles[0]!;
  const notes: string[] = [];
  const subject = cleanSubject(state.subject) || "[describe your subject]";
  if (!cleanSubject(state.subject)) notes.push("Add a subject to replace the placeholder in brackets.");

  const isVideo = state.output === "video";
  const isRestyle = state.task === "restyle";
  const preserve = new Set<PreserveId>(
    isRestyle ? state.preserve.filter((id) => isVideo || id !== "timing") : [],
  );
  const keepComposition = preserve.has("composition");
  const keepColours = preserve.has("colours");
  const keepTiming = isVideo && preserve.has("timing");

  const lines: string[] = [];
  const seen = new Set<string>();
  const add = (label: string, text: string) => {
    lines.push(label ? `${label}: ${text}` : text);
    words(text).forEach((w) => seen.add(w));
  };

  // 1. Task and subject
  const medium = isVideo ? "video" : "image";
  if (isRestyle) {
    add("", `Restyle the provided ${medium} in ${styleRef(style.name)}.`);
    if (cleanSubject(state.subject)) add("Content", `The ${medium} shows ${subject}.`);
  } else if (isVideo) {
    const d = findOption(durationOptions, state.duration)!;
    add("", `A ${d.id}-second video of ${subject}, in ${styleRef(style.name)}.`);
  } else {
    add("", `An image of ${subject}, in ${styleRef(style.name)}.`);
  }

  // 2. Aesthetic characteristics, scaled by intensity
  const cues = style.prompt.cues.slice(0, CUE_COUNT[state.intensity]);
  const cueText = joinList(cues.map(lowerFirst));
  if (state.intensity === "subtle") {
    add("Style", `a light touch; keep the subject natural and borrow only ${cueText}.`);
  } else if (state.intensity === "strong") {
    add("Style", `fully committed to the look: ${cueText}.`);
  } else {
    add("Style", `${cueText}.`);
  }

  // 3. Texture and materials (skipped when the cues already cover them)
  if (state.intensity !== "subtle" && !isRedundant(style.look.texture, seen)) {
    add("Texture", `${style.look.texture}.`);
  }
  if (state.intensity === "strong" && !isRedundant(style.look.materials, seen)) {
    add("Materials", `${style.look.materials}.`);
  }

  // 4. Colour
  if (keepColours) {
    add("Colour", "keep the original colours of the source; apply the style through form, texture and light only.");
    if (state.paletteMode !== "style") notes.push("“Original colours” is preserved, so the selected palette is not used.");
  } else {
    add("Colour palette", paletteSentence(resolvePalette(state, style)));
  }

  // 5. Composition and framing
  if (keepComposition) {
    // The preserve line below covers framing; adding a new one would contradict it.
    if (state.composition !== "style") notes.push("Composition is preserved from the source, so the composition setting is not used.");
  } else {
    const comp =
      state.composition === "style"
        ? style.look.composition
        : findOption(compositionOptions, state.composition)!.phrase;
    const aspect = findOption(aspectOptions, state.aspect)!.phrase;
    // A style-default composition already expressed by the cues only needs the frame.
    if (state.composition === "style" && isRedundant(comp, seen)) add("Framing", `${aspect}.`);
    else add("Composition", `${comp}, in ${aspect}.`);
  }

  // 6. Lighting
  const lighting =
    state.lighting === "style" ? style.look.lighting : findOption(lightingOptions, state.lighting)!.phrase;
  if (state.lighting !== "style" || !isRedundant(lighting, seen)) add("Lighting", `${lighting}.`);

  // 7. Typography only when text is likely to appear
  if (TEXT_HINT.test(state.subject) || preserve.has("text")) {
    if (preserve.has("text")) add("Lettering", "keep existing lettering exactly as it is.");
    else add("Lettering", `if text appears, ${style.look.typography}.`);
  }

  // 8. Motion (video only)
  if (isVideo) {
    if (keepTiming) {
      add("Motion", `keep the source's motion and timing; restyle every frame consistently so the look does not flicker.`);
    } else {
      const cam = findOption(cameraOptions, state.camera)!.phrase;
      const mov = findOption(movementOptions, state.movement)!.phrase;
      add("Camera", `${cam}.`);
      add("Subject motion", `${mov}.`);
      add("Motion character", `${style.prompt.motion}.`);
      if (isRestyle) add("Duration", `match the length of the source clip.`);
      else add("Duration", `${findOption(durationOptions, state.duration)!.phrase}, one continuous shot.`);
    }
  }

  // 9. Preservation (restyle only)
  if (isRestyle) {
    const phrases = preserveOptions.filter((o) => preserve.has(o.id)).map((o) => o.phrase);
    if (phrases.length) add("Preserve", `${joinList(phrases)}.`);
    else notes.push("Nothing is marked to preserve, so the result may drift far from the source.");
  }

  // 10. Avoid — drop items that would contradict the user's own choices
  let avoid = style.prompt.avoid;
  if (state.paletteMode !== "style" || keepColours) avoid = avoid.filter((a) => !COLOUR_WORDS.test(a));
  if (state.lighting !== "style") avoid = avoid.filter((a) => !LIGHT_WORDS.test(a));
  if (avoid.length) add("Avoid", `${joinList(avoid)}.`);

  return { prompt: lines.join("\n"), notes };
}

/** The generic "restyle an existing image" template shown on style pages. */
export function restyleTemplate(style: StyleRecord): string {
  const cues = joinList(style.prompt.cues.slice(0, 4).map(lowerFirst));
  return [
    `Restyle the provided image in ${styleRef(style.name)}.`,
    `Style: ${cues}.`,
    `Texture: ${style.look.texture}.`,
    `Lighting: ${style.look.lighting}.`,
    `Preserve: the identity and facial features of any people, poses, and the original composition and framing.`,
    `Avoid: ${joinList(style.prompt.avoid)}.`,
  ].join("\n");
}

/** Short default prompts for the style detail page tabs. */
export function stylePreviewPrompt(style: StyleRecord, output: "image" | "video"): string {
  const base: BuilderState = {
    style: style.slug,
    output,
    task: "create",
    subject: "",
    intensity: "balanced",
    paletteMode: "style",
    count: 4,
    palette: null,
    custom: style.swatches.map((s) => s.hex) as BuilderState["custom"],
    composition: "style",
    aspect: output === "video" ? "16:9" : "4:5",
    lighting: "style",
    preserve: [],
    duration: 6,
    camera: "push-in",
    movement: "subtle",
  };
  return composePrompt(base).prompt;
}
