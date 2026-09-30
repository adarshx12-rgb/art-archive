import type { AspectId } from "../lib/prompt/options";
import generated from "./templates.generated.json";
import type { Hex, PaletteRole, StyleRecord, StyleTemplate, TemplateBlock, TemplateColour, TemplateFormat } from "./types";

/**
 * Design templates: one layout per style and format, made ahead of time by
 * scripts/templates.mjs and checked there (bounds, overlaps, contrast, fonts).
 * Colours are palette roles, so a template follows whichever palette is chosen.
 */

export interface FormatInfo {
  id: TemplateFormat;
  label: string;
  aspect: AspectId;
  /** Width / height. */
  ratio: number;
  /** Shown under the tab. */
  blurb: string;
  /** Common sizes, e.g. "Letter · A4". */
  spec: string;
  /** What good work in this format gets right; given to the generator. */
  principles: string[];
  /** The text blocks this format expects, e.g. a masthead and cover lines. */
  expects: string;
}

export const TEMPLATE_FORMATS: FormatInfo[] = [
  {
    id: "magazine",
    label: "Magazine cover",
    aspect: "4:5",
    ratio: 4 / 5,
    blurb: "Masthead, cover image and cover lines.",
    spec: "Letter · A4",
    principles: [
      "The masthead owns the top band and stays readable at newsstand distance; the cover image may overlap its lower edge for depth.",
      "One dominant image, usually a single subject; everything else frames it.",
      "Two to four cover lines in a clear hierarchy (one lead line bigger than the rest), grouped down one or both sides so they don't cover the subject's face.",
      "Issue and date details are small and quiet, near the masthead or a corner.",
      "Leave margins of at least 4% of the width; nothing important in the outer 3%.",
    ],
    expects: "a masthead (the magazine name), a lead cover line, two or three smaller cover lines, a small issue/date line, and one large image",
  },
  {
    id: "poster",
    label: "Poster",
    aspect: "2:3",
    ratio: 2 / 3,
    blurb: "One big idea, readable from across a room.",
    spec: "24 × 36 in · A2",
    principles: [
      "One focal point: a dominant image or a dominant headline, never both at equal weight.",
      "The headline is readable from several metres away: large, short, high contrast.",
      "Supporting details (date, place, time, website) are grouped in one compact block.",
      "Use scale contrast and generous negative space; a strong grid or a deliberate break from it.",
      "Keep margins of at least 5% of the width.",
    ],
    expects: "a headline (event or title), an optional subhead, one grouped details block (date, place), an optional call to action, and one image or graphic",
  },
  {
    id: "flyer",
    label: "Pamphlet / flyer",
    aspect: "4:5",
    ratio: 4 / 5,
    blurb: "Headline, image and short information blocks.",
    spec: "Letter · A5",
    principles: [
      "Reads in a few seconds: headline, then image, then the details, then the call to action.",
      "Body text is short, in one or two blocks, set comfortably (never tiny) with clear line length.",
      "A visible call to action (a website, a date, 'Join us') with contrast of its own.",
      "Align everything to a simple grid; consistent margins of at least 6% of the width.",
      "Contact or venue details sit at the bottom, grouped.",
    ],
    expects: "a headline, a subhead, one or two short body blocks, a call to action, a small details line (venue, contact), and one image",
  },
  {
    id: "thumbnail",
    label: "Thumbnail",
    aspect: "16:9",
    ratio: 16 / 9,
    blurb: "Readable at 120 px wide, in a busy grid.",
    spec: "1280 × 720 px",
    principles: [
      "Legible at tiny sizes: at most three to five words of text, very large and bold, high contrast with an outline, shadow or solid plate if needed.",
      "One clear subject (a face with a strong expression, or one object) taking a third or more of the frame, usually on one side with the text on the other.",
      "Strong silhouette and colour separation from the background; avoid fine detail that turns to mush when small.",
      "Keep the bottom-right corner clear: video players put the duration there.",
      "Asymmetric layouts read faster than centred ones at this size.",
    ],
    expects: "a very short headline (2–5 words), an optional small tag or label, and one large image of a single subject",
  },
];

export const formatInfo = (id: TemplateFormat) => TEMPLATE_FORMATS.find((f) => f.id === id)!;
export const isTemplateFormat = (id: string): id is TemplateFormat => TEMPLATE_FORMATS.some((f) => f.id === id);

const all = generated as StyleTemplate[];
const byKey = new Map(all.map((t) => [`${t.style}/${t.format}`, t]));

export const getTemplate = (style: string, format: TemplateFormat): StyleTemplate | undefined => byKey.get(`${style}/${format}`);

/** A style's templates in format order. */
export const templatesFor = (style: string): StyleTemplate[] =>
  TEMPLATE_FORMATS.flatMap((f) => {
    const t = getTemplate(style, f.id);
    return t ? [t] : [];
  });

const TEXT_KINDS = new Set<TemplateBlock["kind"]>(["masthead", "headline", "subhead", "coverline", "body", "cta", "meta"]);
export const isTextBlock = (b: TemplateBlock) => TEXT_KINDS.has(b.kind) && typeof b.text === "string";

const SLOT_ORDER: TemplateBlock["kind"][] = ["masthead", "headline", "subhead", "coverline", "body", "cta", "meta"];

/** The words a visitor can change, most prominent first, then top to bottom. */
export const textSlots = (t: StyleTemplate) =>
  t.blocks.filter(isTextBlock).sort((a, b) => SLOT_ORDER.indexOf(a.kind) - SLOT_ORDER.indexOf(b.kind) || a.y - b.y);

/** Each block's words: the visitor's, or the sample. */
export function slotText(t: StyleTemplate, texts: Record<string, string>): Record<string, string> {
  return Object.fromEntries(textSlots(t).map((b) => [b.id, texts[b.id]?.trim() ? texts[b.id]!.trim() : b.text!]));
}

/** The template's layout direction with its {slots} filled. */
export function fillPrompt(t: StyleTemplate, texts: Record<string, string>): string {
  const words = slotText(t, texts);
  return t.prompt.replace(/\{([a-z0-9-]+)\}/gi, (whole, id: string) => (id in words ? `"${words[id]}"` : whole));
}

export type RoleColours = Record<TemplateColour, Hex>;

/** The neutrals, the same as the site's own ink and paper. */
const NEUTRALS = { ink: "#191919", paper: "#F4F2ED" } as const satisfies Record<"ink" | "paper", Hex>;

/** Hex values for each role, from the style's four swatches (background, primary, secondary, accent). */
export const styleColours = (style: StyleRecord): RoleColours => ({
  background: style.swatches[0].hex,
  primary: style.swatches[1].hex,
  secondary: style.swatches[2].hex,
  accent: style.swatches[3].hex,
  ...NEUTRALS,
});

/** Roles missing from a smaller palette borrow the nearest one that exists. */
export function roleColours(colours: { hex: Hex; role: PaletteRole }[], fallback: RoleColours): RoleColours {
  const get = (r: PaletteRole) => colours.find((c) => c.role === r)?.hex;
  const background = get("background") ?? fallback.background;
  const primary = get("primary") ?? get("accent") ?? fallback.primary;
  const accent = get("accent") ?? primary;
  const secondary = get("secondary") ?? accent;
  return { background, primary, secondary, accent, ...NEUTRALS };
}
