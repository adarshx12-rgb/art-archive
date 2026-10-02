import type { ColourFacet, FormFacet, StyleRecord } from "./types";

/**
 * The art director's vocabulary: ways of making, compositional moves,
 * wordless graphic extras and print finishes, each tagged with the style
 * facets it suits. The concepts model picks from a style's shortlist
 * (craftFor) so its ideas read as designed, not generic.
 */

export type CraftKind = "technique" | "device" | "furniture" | "finish";

export interface CraftEntry {
  id: string;
  kind: CraftKind;
  /** Short tag for concept cards, e.g. "halftone". */
  label: string;
  /** Prompt-ready phrase. */
  phrase: string;
  /** Style facets it suits; empty suits any style. */
  suits: (FormFacet | ColourFacet)[];
  /** How it behaves in video, when that differs. */
  video?: string;
  /** Only works when the visitor typed words to letter. */
  lettering?: true;
}

type Suits = CraftEntry["suits"];
const entry = (kind: CraftKind) => (id: string, label: string, phrase: string, suits: Suits = [], video?: string): CraftEntry => ({ id, kind, label, phrase, suits, ...(video ? { video } : {}) });
const technique = entry("technique");
const device = entry("device");
const furniture = entry("furniture");
const finish = entry("finish");
/** Marks a device that only works on the visitor's own words. */
const needsWords = (c: CraftEntry): CraftEntry => ({ ...c, lettering: true });

export const craft: CraftEntry[] = [
  // ——— Techniques: how the hero is made ———
  technique("halftone-screen", "halftone", "coarse halftone-dot screen across the image, dots visible at arm's length", ["photographic", "textured", "restrained"], "the dot screen shimmers as things move"),
  technique("one-bit-dither", "1-bit dither", "1-bit dithered rendering: pure black and white pixels in an ordered dither pattern", ["digital", "restrained", "geometric"], "the dither pattern crawls between frames"),
  technique("duotone", "duotone", "two-colour duotone photograph, shadows in the darker ink and highlights in the paper colour", ["photographic", "restrained", "muted"]),
  technique("riso-overprint", "risograph", "risograph print with two overprinted inks, slight misregistration where they overlap", ["textured", "illustrative", "vivid", "pastel"], "ink layers drift slightly out of register"),
  technique("pixel-mosaic-fill", "pixel mosaic", "a silhouette filled with a tiled, stepped pixel-mosaic of a photograph, hard pixel edges, no anti-aliasing", ["digital", "geometric", "photographic"], "the mosaic tiles resolve from coarse to fine"),
  technique("photocopy-blowup", "photocopy", "high-contrast photocopier blow-up: blown highlights, solid black shadows, no mid-tones", ["photographic", "textured", "restrained"], "copier flicker between frames"),
  technique("linocut", "linocut", "linocut print: bold carved black shapes with gouge marks and uneven ink", ["illustrative", "textured", "organic", "earthy"]),
  technique("cyanotype", "cyanotype", "cyanotype print: Prussian-blue ground with pale exposed silhouettes", ["photographic", "organic", "muted"]),
  technique("airbrush-gradient", "airbrush", "soft airbrushed gradients with a fine grainy spray", ["digital", "illustrative", "pastel", "neon"]),
  technique("chrome-render", "chrome", "liquid chrome surface with sharp environment reflections", ["dimensional", "metallic", "digital"], "reflections slide across the chrome"),
  technique("cut-paper", "cut paper", "flat cut-paper shapes with slightly uneven scissor edges and soft paper shadows", ["illustrative", "organic", "geometric"], "paper pieces shift like stop-motion"),
  technique("screenprint-flats", "screenprint", "flat screenprinted colour shapes, no gradients, each ink its own layer", ["geometric", "illustrative", "vivid"]),
  technique("wood-engraving", "engraving", "fine engraved hatching like a wood engraving, lines following the form", ["illustrative", "ornamental", "restrained"]),
  technique("ink-wash", "ink wash", "loose ink-wash brushwork with wet edges and dry-brush texture", ["organic", "illustrative", "muted"], "ink blooms and spreads"),
  technique("vector-flat", "flat vector", "clean flat vector shapes with crisp edges and no texture", ["geometric", "digital"]),
  technique("soft-clay", "clay", "soft matte clay forms with rounded edges and gentle studio shadows", ["dimensional", "pastel"], "squash-and-stretch clay motion"),
  technique("glass-tube", "glass tubes", "glossy glass tubes and rounded shapes with chrome glow outlines", ["dimensional", "digital", "neon", "metallic"]),
  technique("crt-scanlines", "scanlines", "CRT scanlines with slight RGB fringing across the image", ["digital", "neon", "dark"], "scanlines roll slowly"),
  technique("hand-collage", "collage", "photographs cut out by hand and pasted at angles, visible paper edges", ["photographic", "textured"], "cut-outs pop on frame by frame"),
  technique("stencil-spray", "stencil", "spray-painted stencil with soft overspray and drips", ["textured", "vivid"]),
  technique("marker-scribble", "marker", "hand-drawn marker scribbles with bleeding ink and childlike loops", ["illustrative", "organic", "vivid"], "scribbles draw themselves on"),
  technique("blueprint-line", "line drawing", "thin precise white linework on a deep flat ground, like a technical drawing", ["geometric", "typographic", "restrained"]),
  technique("louver-slats", "louvers", "forms built from ribbed 3D venetian-blind slats fading into the ground", ["dimensional", "typographic", "geometric"], "slats rotate open and shut"),
  technique("infrared-photo", "infrared", "false-colour infrared photograph, foliage turned pink and red", ["photographic", "vivid"]),
  technique("light-trails", "light trails", "long-exposure light trails streaking through the dark", ["photographic", "neon", "dark"], "trails draw across the frame"),
  technique("gold-leaf", "gold leaf", "gold-leaf areas with fine crackle against flat colour", ["ornamental", "metallic"]),

  // ——— Devices: the one compositional move ———
  device("colossal-crop", "colossal crop", "the main subject scaled up until the frame edges crop it"),
  device("cutout-window", "cutout window", "a flat colour field with one cut-out shape revealing the image underneath", ["geometric", "photographic"]),
  device("silhouette-fill", "silhouette fill", "the main subject as a silhouette filled with a different, related image", ["photographic", "digital"]),
  needsWords(device("giant-glyph", "giant letter", "one giant letter or numeral from the lettering fills the frame as the ground", ["typographic"])),
  needsWords(device("stacked-column", "type column", "the lettering stacked as one tall vertical column", ["typographic", "geometric"])),
  device("single-band", "single band", "one solid horizontal band cutting across the frame", ["geometric", "restrained"]),
  device("tiny-in-vast", "empty space", "the subject small and placed low in a vast field of empty space"),
  device("torn-split", "torn split", "the image torn in two, the halves knocked out of line", ["textured", "photographic"]),
  device("repeat-grid", "repeat grid", "the subject repeated in a strict grid with one cell different", ["geometric", "digital"]),
  device("frame-in-frame", "frame in frame", "the subject seen through a frame inside the frame: a window, arch or box", ["ornamental", "geometric"]),
  device("edge-tension", "edge tension", "the subject pushed hard against one edge, the rest left open"),
  needsWords(device("type-behind", "type behind", "the lettering passes behind the subject, partly hidden", ["typographic", "photographic"])),
  device("diagonal-thrust", "diagonal", "one strong diagonal running corner to corner, carrying the eye", ["geometric"]),
  device("split-field", "split field", "the frame split into two flat colour halves, the subject straddling the line", ["geometric", "vivid"]),
  device("mirror-symmetry", "symmetry", "strict mirrored symmetry around a vertical centre line", ["ornamental"]),
  device("motion-sequence", "sequence", "the subject shown as a sequence of frames, like a contact strip", ["photographic"]),
  device("scale-clash", "scale clash", "two things at absurdly mismatched scales side by side", ["illustrative", "photographic"]),
  device("stamp-frame", "stamp frame", "a heavy border framing a small centred image, like a stamp or label", ["ornamental", "earthy"]),
  needsWords(device("type-as-image", "type as image", "the lettering itself forms the image", ["typographic"])),
  device("radial-burst", "radial burst", "everything radiating out from one point behind the subject", ["vivid", "ornamental"]),

  // ——— Furniture: wordless graphic extras ———
  furniture("barcode", "barcode", "a small barcode", ["typographic", "textured"]),
  furniture("calibration-strip", "colour strip", "a thin calibration strip of colour squares", ["photographic", "digital"]),
  furniture("registration-marks", "reg marks", "small printer's registration marks", ["textured", "typographic"]),
  furniture("crop-marks", "crop marks", "thin crop marks at the corners"),
  furniture("keyline-border", "keyline", "a thin keyline border inset from the edge", ["geometric"]),
  furniture("pill-badge", "pill badge", "a crisp rounded pill badge", ["digital", "typographic"]),
  furniture("checker-square", "checkerboard", "a small checkerboard square", ["digital", "geometric"]),
  furniture("crosshair", "crosshair", "a tiny crosshair star glyph", ["digital", "geometric"]),
  furniture("cursor-arrow", "cursor", "a small cursor-arrow glyph", ["digital"]),
  furniture("photo-tiles", "photo tiles", "three tiny square photo tiles with thin white borders", ["photographic"]),
  furniture("tape-strips", "tape", "two strips of yellowed masking tape", ["textured"]),
  furniture("construction-grid", "grid lines", "faint construction grid lines", ["geometric", "typographic"]),
  furniture("stamp-ring", "stamp ring", "a faded circular rubber-stamp ring", ["textured", "earthy"]),
  furniture("dot-row", "dot row", "a row of small filled and empty circles", ["geometric"]),
  furniture("staple", "staple", "a single staple in a top corner", ["textured"]),

  // ——— Finishes: the surface it ends on ———
  finish("photocopy-contrast", "photocopy", "photocopy contrast with toner specks and a grey edge shadow", ["textured", "restrained"]),
  finish("screenprint-grain", "screenprint grain", "screenprint grain and slightly uneven ink coverage", ["textured", "vivid"]),
  finish("newsprint", "newsprint", "newsprint halftone on thin off-white paper", ["photographic", "muted"]),
  finish("scanned-paper", "scanned paper", "scanned-paper texture with faint fold creases and scan banding", ["textured"]),
  finish("misregistration", "misregistration", "offset misregistration, colours slightly out of line", ["vivid", "illustrative"]),
  finish("paper-tooth", "paper tooth", "visible paper tooth under the ink", ["illustrative", "organic"]),
  finish("riso-grain", "riso grain", "risograph grain and patchy ink density", ["pastel", "vivid"]),
  finish("film-grain", "film grain", "fine colour film grain", ["photographic"]),
  finish("uncoated-matte", "matte", "uncoated matte stock, colours slightly flat", ["muted", "earthy"]),
  finish("glossy-coated", "gloss", "glossy coated print with a soft sheen", ["vivid", "metallic"]),
  finish("screen-glow", "screen glow", "slight screen bloom and glow around bright areas", ["digital", "neon", "dark"]),
  finish("sun-faded", "sun-faded", "sun-faded colours on softly yellowed paper", ["earthy", "muted"]),
  finish("marker-bleed", "marker bleed", "marker bleed and xerox grain", ["illustrative", "textured"]),
];

const byId = new Map(craft.map((c) => [c.id, c]));
export const getCraft = (id: string) => byId.get(id);

const QUOTA: Record<CraftKind, number> = { technique: 10, device: 8, furniture: 6, finish: 6 };

/** The entries that best suit a style: most shared facets first (entries that suit any style count half), then library order. */
export function craftFor(style: Pick<StyleRecord, "formFacets" | "colourFacets">): CraftEntry[] {
  const facets = new Set<string>([...style.formFacets, ...style.colourFacets]);
  const score = (c: CraftEntry) => (c.suits.length === 0 ? 0.5 : c.suits.filter((s) => facets.has(s)).length);
  return (Object.keys(QUOTA) as CraftKind[]).flatMap((kind) =>
    craft
      .filter((c) => c.kind === kind)
      .map((c, i) => ({ c, s: score(c), i }))
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, QUOTA[kind])
      .map((x) => x.c),
  );
}
