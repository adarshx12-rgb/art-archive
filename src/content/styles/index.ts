import type { StyleRecord } from "../types";
import { craftStyles } from "./craft";
import { digitalStyles } from "./digital";
import { movementStyles } from "./movements";
import { printStyles } from "./print";
import { retroStyles } from "./retro";

/**
 * The full style catalogue. To add a style, append a `defineStyle({...})`
 * entry to one of the group files (or a new file imported here). The
 * content tests check slugs, related links and references for you.
 */
export const styles: StyleRecord[] = [
  ...movementStyles,
  ...printStyles,
  ...retroStyles,
  ...digitalStyles,
  ...craftStyles,
];

const bySlug = new Map(styles.map((s) => [s.slug, s]));

export function getStyle(slug: string | null | undefined): StyleRecord | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const featuredStyles = styles
  .filter((s) => s.featured !== undefined)
  .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
