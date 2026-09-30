import { covers } from "../covers";
import type { StyleRecord } from "../types";
import { craftStyles } from "./craft";
import { descriptions } from "./descriptions";
import { digitalStyles } from "./digital";
import { movementStyles } from "./movements";
import { printStyles } from "./print";
import { retroStyles } from "./retro";

/**
 * The full style catalogue, including styles still waiting for a cover. To
 * add a style, append a `defineStyle({...})` entry to one of the group files
 * (or a new file imported here). The content tests check slugs, related
 * links and references for you.
 */
export const allStyles: StyleRecord[] = [
  ...movementStyles,
  ...printStyles,
  ...retroStyles,
  ...digitalStyles,
  ...craftStyles,
].map((s) => ({ ...s, description: descriptions[s.slug] ?? "" }));

/**
 * The styles the site shows: only those with a cover image. A style appears
 * as soon as its cover is added (scripts/covers.py). Related links to
 * styles not shown yet are left out.
 */
const shown = new Set(allStyles.filter((s) => covers[s.slug]).map((s) => s.slug));
export const styles: StyleRecord[] = allStyles
  .filter((s) => shown.has(s.slug))
  .map((s) => ({ ...s, related: s.related.filter((r) => shown.has(r)) }));

const bySlug = new Map(styles.map((s) => [s.slug, s]));

export function getStyle(slug: string | null | undefined): StyleRecord | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export const featuredStyles = styles
  .filter((s) => s.featured !== undefined)
  .sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
