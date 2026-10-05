import { getStyle } from "../styles";
import type { PaletteRecord } from "../types";
import { craftPalettes } from "./craft";
import { digitalPalettes } from "./digital";
import { libraryPalettes } from "./library";
import { movementPalettes } from "./movements";
import { printPalettes } from "./print";
import { retroPalettes } from "./retro";

/**
 * Every palette: the original cross-style library first, then the palettes
 * made for each style family. The rules every palette follows are in library.ts.
 */
export const allPalettes: PaletteRecord[] = [...libraryPalettes, ...movementPalettes, ...printPalettes, ...retroPalettes, ...digitalPalettes, ...craftPalettes];

/**
 * The palettes the site shows: those made for at least one shown style. A
 * style's palettes appear with it, once its cover is added.
 */
export const palettes: PaletteRecord[] = allPalettes.filter((p) => p.suits.some((slug) => getStyle(slug)));

const bySlug = new Map(palettes.map((pl) => [pl.slug, pl]));

export function getPalette(slug: string | null | undefined): PaletteRecord | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const featuredPalettes = palettes.filter((pl) => pl.featured !== undefined).sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
