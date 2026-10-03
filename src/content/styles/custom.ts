import type { StyleLook, StylePrompt, StyleRecord } from "../types";
import { c, defineStyle } from "./define";

/** The builder's "Custom…" style: the visitor describes it, optionally starting from a template. */
export const CUSTOM_SLUG = "custom";

export const CUSTOM_STYLE_MAX = 400;

export interface CustomStyleSpec {
  /** The starter template the description came from, or null when written from scratch. */
  template: string | null;
  text: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  /** One line under the template's name in the picker. */
  blurb: string;
  /** What fills the description box. */
  text: string;
  style: { swatches: StyleRecord["swatches"]; look: StyleLook; prompt: StylePrompt };
}

export const customTemplates: CustomTemplate[] = [
  {
    id: "canvas",
    name: "Canvas",
    blurb: "Freestyle, like MS Paint",
    text: "Drawn freehand in MS Paint: wobbly mouse-drawn outlines, flat paint-bucket fills, hard aliased pixel edges and the default bright palette on a white canvas.",
    style: {
      swatches: [c("#FFFFFF", "canvas white"), c("#000000", "pencil black"), c("#FF0000", "paint red"), c("#0000FF", "paint blue")],
      look: {
        colour: "pure default-palette brights on white",
        texture: "hard aliased pixel edges with no anti-aliasing",
        materials: "a 1990s paint program on a low-resolution screen",
        lighting: "flat, with no shading beyond a spray-can dot",
        composition: "objects floating on a white canvas, roughly sized and spaced",
        typography: "blocky default system lettering typed with the text tool",
      },
      prompt: {
        cues: [
          "wobbly, mouse-drawn black outlines",
          "flat paint-bucket fills in pure default colours",
          "hard, aliased pixel edges",
          "a stray spray-can speckle and an unfilled gap where the bucket leaked",
          "naive, freehand proportions on a white canvas",
        ],
        motion: "jerky, frame-by-frame redraws as if animated by hand in a paint program",
        avoid: ["smooth gradients", "anti-aliased vector lines", "realistic shading", "painterly brushwork"],
      },
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    blurb: "Chalk on slate, dusty and smudged",
    text: "Drawn in white and coloured chalk on a slate-green chalkboard: dusty strokes, finger-smudged shading and half-erased ghost marks of earlier drawings.",
    style: {
      swatches: [c("#2F4A3F", "slate green"), c("#F2F0E6", "chalk white"), c("#F3D36B", "chalk yellow"), c("#E58FA0", "chalk pink")],
      look: {
        colour: "chalk white with soft yellow, pink and blue on slate green",
        texture: "dusty, broken chalk strokes over the board's grain",
        materials: "stick chalk on a worn slate-green chalkboard",
        lighting: "even classroom light with a faint sheen on the board",
        composition: "a drawing set in the middle of the board, with ghost marks around it",
        typography: "hand-lettered chalk script and printed capitals",
      },
      prompt: {
        cues: [
          "dusty white and coloured chalk strokes on slate green",
          "finger-smudged, soft shading",
          "half-erased ghost marks of earlier drawings",
          "broken strokes where the chalk skips over the board's grain",
          "a fine dust of chalk along the bottom edge",
        ],
        motion: "lines drawn on stroke by stroke, with chalk dust drifting down",
        avoid: ["crisp digital lines", "glossy surfaces", "solid opaque fills", "photorealism"],
      },
    },
  },
  {
    id: "watercolour",
    name: "Watercolour",
    blurb: "Loose washes on paper",
    text: "Painted in loose watercolour on cold-pressed paper: wet-in-wet blooms, hard pigment edges where washes dried and white paper left showing for highlights.",
    style: {
      swatches: [c("#F7F3EA", "paper white"), c("#3E6A8A", "indigo wash"), c("#D9876A", "burnt sienna"), c("#8FAE7E", "sap green")],
      look: {
        colour: "transparent, layered washes that mix on the paper",
        texture: "cold-pressed paper grain with pigment settling into it",
        materials: "watercolour on heavy cold-pressed paper",
        lighting: "soft daylight, with white paper as the brightest light",
        composition: "a loosely painted subject that fades out towards the paper's edges",
        typography: "loose hand-brushed lettering",
      },
      prompt: {
        cues: [
          "wet-in-wet blooms and soft bleeding edges",
          "hard pigment rims where washes dried",
          "white paper left untouched for highlights",
          "transparent, layered glazes",
          "visible cold-pressed paper grain",
        ],
        motion: "colour slowly blooming and spreading through wet paper",
        avoid: ["opaque gouache fills", "hard digital outlines", "heavy black linework", "photorealism"],
      },
    },
  },
];

export const getCustomTemplate = (id: string | null | undefined) => customTemplates.find((t) => t.id === id);

/** Used when the description is written from scratch: the words carry the style, so nothing else is added. */
const blank: CustomTemplate["style"] = {
  swatches: [c("#FFFFFF", "white"), c("#1A1A1A", "near black"), c("#8A8A8A", "mid grey"), c("#D8342C", "signal red")],
  look: { colour: "", texture: "", materials: "", lighting: "", composition: "", typography: "" },
  prompt: { cues: [], motion: "movement true to the described look", avoid: [] },
};

/**
 * The style record for a custom description. An untouched template is used
 * in full. Edited or original words become the style cue as written, with
 * nothing else added that could contradict them; an edited template keeps
 * only its colours.
 */
export function customStyle(spec: CustomStyleSpec): StyleRecord {
  const template = getCustomTemplate(spec.template);
  const text = spec.text.trim();
  const untouched = !!template && text === template.text;
  const base = untouched ? template.style : blank;
  const cue = text.replace(/[.;,\s]+$/, "");
  return defineStyle({
    slug: CUSTOM_SLUG,
    name: untouched ? template.name : "Custom",
    kind: "technique",
    summary: text || "Describe your own style.",
    about: text,
    tags: [],
    colourFacets: [],
    formFacets: [],
    density: "balanced",
    swatches: (template ?? { style: blank }).style.swatches,
    look: base.look,
    prompt: { ...base.prompt, cues: untouched || !cue ? base.prompt.cues : [cue] },
  });
}
