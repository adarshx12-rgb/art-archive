import { palettes } from "../../content/palettes";
import type { Hex, PaletteSize, StyleRecord } from "../../content/types";

export interface SuggestedPalette {
  name: string;
  hexes: Hex[];
  /** Set when this is a curated palette. */
  slug?: string;
  /** The style's own colours (the builder's "Auto" palette at this size). */
  own?: boolean;
}

export interface SuggestionGroup {
  size: PaletteSize;
  options: SuggestedPalette[];
}

const MAX_PER_SIZE = 4;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Palettes to offer for a style, 1 to 4 colours: the style's own colours
 * first, then curated palettes made for it. A 1-colour option is a
 * background only.
 */
export function styleSuggestions(style: StyleRecord): SuggestionGroup[] {
  const suited = palettes.filter((p) => p.suits.includes(style.slug));
  const sizes: PaletteSize[] = [1, 2, 3, 4];
  return sizes.map((size) => {
    const candidates: SuggestedPalette[] =
      size === 1
        ? [
            { name: `${style.name} background`, hexes: [style.swatches[0].hex], own: true },
            ...suited.map((p) => ({ name: capitalise(p.colours[0]!.name), hexes: [p.colours[0]!.hex] })),
            // Styles with few curated palettes still get a choice of grounds.
            ...style.swatches.slice(1).map((s) => ({ name: capitalise(s.name), hexes: [s.hex] })),
          ]
        : [
            { name: `${style.name} colours`, hexes: style.swatches.slice(0, size).map((s) => s.hex), own: true },
            ...suited.filter((p) => p.colours.length === size).map((p) => ({ name: p.name, hexes: p.colours.map((c) => c.hex), slug: p.slug })),
          ];
    const seen = new Set<string>();
    const options = candidates.filter((o) => {
      const key = o.hexes.join();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { size, options: options.slice(0, MAX_PER_SIZE) };
  });
}
