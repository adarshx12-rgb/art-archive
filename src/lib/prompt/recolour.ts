import type { StyleRecord } from "../../content/types";
import type { ResolvedColour, ResolvedPalette } from "./compose";

/**
 * A style's colours are a suggestion, not a rule. When the user picks other
 * colours, the style's own words ("white linework on Prussian blue") would
 * fight the palette, so they are rewritten in the chosen colours: role for
 * role, and any colour of the style beyond the palette's size to the palette
 * colour nearest in lightness. A one-colour palette sets only the ground.
 */
export interface ColourSwap {
  /** The style's colour, as its swatch names it. */
  from: string;
  fromHex: string;
  to: ResolvedColour;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lightness = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const distance = (a: string, b: string) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]!));

export function colourSwaps(palette: ResolvedPalette, style: StyleRecord): ColourSwap[] {
  if (palette.source === "style" || !style.swatches.length || !palette.colours.length) return [];
  const own = new Set(style.swatches.map((s) => s.hex.toLowerCase()));
  if (palette.colours.every((c) => own.has(c.hex.toLowerCase()))) return [];
  const swatches = palette.colours.length === 1 ? style.swatches.slice(0, 1) : style.swatches;
  return swatches
    .map((sw, i) => ({
      from: sw.name,
      fromHex: sw.hex,
      to: palette.colours[i] ?? [...palette.colours].sort((a, b) => Math.abs(lightness(a.hex) - lightness(sw.hex)) - Math.abs(lightness(b.hex) - lightness(sw.hex)))[0]!,
    }))
    .filter((s) => s.fromHex.toLowerCase() !== s.to.hex.toLowerCase());
}

/** Plain colour words that, on their own, mean the swatch they end ("white" for "chalk white"). */
const BASIC = new Set(["white", "black", "blue", "red", "green", "yellow", "orange", "purple", "violet", "pink", "brown", "grey", "gray", "gold", "silver", "cream", "ivory", "navy", "teal", "cyan", "magenta", "beige", "ochre", "crimson", "scarlet", "turquoise", "indigo", "olive", "rust", "sepia"]);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Rewrites the style's colour names as the palette colours they became. */
export function recolourText(text: string, swaps: ColourSwap[]): string {
  if (!swaps.length) return text;
  const terms: [string, ColourSwap][] = swaps.map((s) => [s.from, s]);
  for (const s of swaps) {
    const last = s.from.toLowerCase().split(/\s+/).pop()!;
    if (BASIC.has(last) && !terms.some(([t]) => t.toLowerCase() === last)) terms.push([last, s]);
  }
  // Longest first, so "Prussian blue" goes before "blue"; placeholders stop a new name being replaced again.
  terms.sort((a, b) => b[0].length - a[0].length);
  let out = text;
  terms.forEach(([term], i) => {
    out = out.replace(new RegExp(`(?<![\\w-])${escape(term)}(?![\\w-])`, "gi"), `\u0000${i}\u0000`);
  });
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => terms[Number(i)]![1].to.name);
}

/** Every string in a value, recoloured (for style looks and inspiration notes). */
export function recolourDeep<T>(value: T, swaps: ColourSwap[]): T {
  if (!swaps.length) return value;
  if (typeof value === "string") return recolourText(value, swaps) as T;
  if (Array.isArray(value)) return value.map((v) => recolourDeep(v, swaps)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, recolourDeep(v, swaps)])) as T;
  return value;
}

/** The style as the prompt describes it: its looks and cues in the chosen colours. */
export function recolourStyle(style: StyleRecord, swaps: ColourSwap[]): StyleRecord {
  if (!swaps.length) return style;
  return { ...style, look: recolourDeep(style.look, swaps), prompt: recolourDeep(style.prompt, swaps) };
}

/**
 * The style's own colours that the palette has nothing close to: worth naming
 * in the Avoid line, since generators otherwise drift back to them (a blue
 * blueprint).
 */
export function displacedColours(swaps: ColourSwap[], palette: ResolvedPalette): string[] {
  return [...new Set(swaps.filter((s) => palette.colours.every((c) => distance(c.hex, s.fromHex) > 80)).map((s) => s.from))];
}
