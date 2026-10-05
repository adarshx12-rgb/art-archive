import { getStyle, styles } from "../content/styles";
import type { Hex, PaletteRecord } from "../content/types";
import { normaliseHex } from "./color";

/** A typed hex, with or without #, 3 or 6 digits; null when it isn't one. */
export function parseHexInput(text: string): Hex | null {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text.trim()) ? normaliseHex(text) : null;
}

/** The style a swap starts on: the one the visitor came from, else the palette's first suited style. */
export function initialSwapStyle(palette: PaletteRecord, s: string | null): string {
  if (getStyle(s)) return s!;
  return palette.suits.find((slug) => getStyle(slug)) ?? styles[0]!.slug;
}

/** The builder with these colours as a custom palette, in the given style. */
export function swapBuilderHref(hexes: Hex[], style: string): string {
  return `/builder?pm=custom&c=${hexes.map((h) => h.slice(1)).join("-")}&s=${style}`;
}
