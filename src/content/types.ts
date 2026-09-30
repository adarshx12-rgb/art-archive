/**
 * Content model. Everything the UI renders about styles, palettes and
 * reference imagery is described by these records — components never hold
 * catalogue content themselves.
 */

/** How the entry should be understood. Not every style is an art movement. */
export type StyleKind =
  | "movement" // a recognised art, design or architecture movement
  | "period" // a period look drawn from an era's visual culture
  | "aesthetic" // a named, often internet-era, aesthetic
  | "technique" // a way of making (collage, pixel art, lettering…)
  | "interface"; // a UI / screen-design style

export type ColourFacet =
  | "restrained" // black, white, one or two colours
  | "muted"
  | "earthy"
  | "pastel"
  | "vivid"
  | "neon"
  | "metallic"
  | "dark";

export type FormFacet =
  | "geometric"
  | "organic"
  | "typographic"
  | "ornamental"
  | "photographic"
  | "illustrative"
  | "textured"
  | "digital"
  | "dimensional";

export type Density = "sparse" | "balanced" | "dense";

export type Hex = `#${string}`;

export interface NamedColour {
  hex: Hex;
  /** Plain descriptive name used in prompts, e.g. "oxblood red". */
  name: string;
}

/** Observable visual ingredients, written as prompt-ready phrases. */
export interface StyleLook {
  colour: string;
  texture: string;
  materials: string;
  lighting: string;
  composition: string;
  typography: string;
}

export interface StylePrompt {
  /**
   * Concrete visual cues, most characteristic first. Intensity controls how
   * many are used: subtle = 2, balanced = 4, strong = all.
   */
  cues: string[];
  /** How things move when the style is animated (video prompts). */
  motion: string;
  /** Things that commonly pull a result away from this style. */
  avoid: string[];
}

/** Illustrative SVG study that ships with the app (see src/art). */
export interface StudyArt {
  kind: "study";
  /** Key of a renderer in src/art/studies. Defaults to the style slug. */
  renderer?: string;
}

export interface StyleRecord {
  slug: string;
  name: string;
  aliases: string[];
  kind: StyleKind;
  /** One sentence for cards. */
  summary: string;
  /** Two–four sentences for the detail page. Visual, not historical claims. */
  about: string;
  /** The short description at the top of the style page (content/styles/descriptions.ts). */
  description: string;
  /** Optional caveat, e.g. when a label is used inconsistently online. */
  note?: string;
  tags: string[];
  colourFacets: ColourFacet[];
  formFacets: FormFacet[];
  density: Density;
  /** Exactly four defining colours, most dominant first. */
  swatches: [NamedColour, NamedColour, NamedColour, NamedColour];
  look: StyleLook;
  prompt: StylePrompt;
  related: string[];
  /** IDs from content/references.ts. Supporting imagery with provenance. */
  references: string[];
  art: StudyArt;
  /** Lower number = earlier in "Featured" sort and on the homepage. */
  featured?: number;
}

/** 1 sets the background only; curated palettes have 2 to 4. */
export type PaletteSize = 1 | 2 | 3 | 4;

export type PaletteRole = "background" | "primary" | "secondary" | "accent";

export interface PaletteColour extends NamedColour {
  role: PaletteRole;
  /** Suggested share of the image, in percent. A palette's shares total 100. */
  share: number;
}

export interface PaletteRecord {
  slug: string;
  name: string;
  mood: string;
  description: string;
  colours: PaletteColour[];
  /** Style slugs this palette is curated for. */
  suits: string[];
  /** Layout used by the palette's reference composition (src/art/PaletteArt). */
  composition: PaletteComposition;
  featured?: number;
}

export type PaletteComposition =
  | "fields"
  | "arch"
  | "stripes"
  | "orbit"
  | "steps"
  | "split"
  | "window"
  | "wave";

export type Licence =
  | "Public domain"
  | "CC0 1.0"
  | "CC BY 2.0"
  | "CC BY-SA 4.0";

/** A photographed / scanned reference work with full provenance. */
export interface ReferenceImage {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  creator: string;
  date: string;
  alt: string;
  /** Why this image is useful for the style — honest about what it is. */
  caption: string;
  licence: Licence;
  licenceUrl?: string;
  sourceUrl: string;
  sourceName: "Wikimedia Commons";
  /** Always false for real references; placeholders are SVG studies. */
  placeholder: false;
}

// ——— Design templates (content/templates.ts) ———

export type TemplateFormat = "magazine" | "poster" | "flyer" | "thumbnail";

export type TemplateBlockKind = "masthead" | "headline" | "subhead" | "coverline" | "body" | "cta" | "meta" | "image" | "shape";

/** A palette role, or one of two neutrals every template may use for type: ink (near-black) and paper (off-white). */
export type TemplateColour = PaletteRole | "ink" | "paper";

export type TemplateShape = "rect" | "circle" | "line" | "arc" | "stripes" | "sunburst" | "frame";

/** One element of a template. Positions and sizes are fractions of the canvas (0–1). */
export interface TemplateBlock {
  id: string;
  kind: TemplateBlockKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees, clockwise. */
  rotate?: number;
  /** Text blocks: sample words, and the field name visitors fill in ("Headline"). */
  text?: string;
  label?: string;
  font?: string;
  weight?: number;
  /** Font size (1 em) as a fraction of the canvas height. */
  size?: number;
  align?: "left" | "center" | "right";
  upper?: boolean;
  /** Letter spacing in em. */
  tracking?: number;
  /** Line height as a multiple of the size. */
  leading?: number;
  italic?: boolean;
  colour?: TemplateColour;
  /** Shapes and image frames. */
  shape?: TemplateShape;
  fill?: TemplateColour;
  stroke?: TemplateColour;
  opacity?: number;
  /** Image areas: which part of the picture to keep when cropping, 0 = top, 0.5 = middle, 1 = bottom. */
  focus?: number;
  /** Image areas: the same, across: 0 = left, 0.5 = centre, 1 = right. */
  focusX?: number;
  /** Image areas: how far to zoom in on the focus (1 = fit the area). */
  zoom?: number;
}

export interface StyleTemplate {
  style: string;
  format: TemplateFormat;
  /** A short name for the layout, e.g. "Sunburst masthead". */
  name: string;
  /** Why the layout works for the style and format, 3–4 short notes. */
  notes: string[];
  background: TemplateColour;
  /** Drawn in order: the first is at the back. */
  blocks: TemplateBlock[];
  /** Layout direction for image prompts; {id} slots are filled with the block's text. */
  prompt: string;
}
