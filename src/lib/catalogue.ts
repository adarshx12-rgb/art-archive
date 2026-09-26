import { palettes } from "../content/palettes";
import { getStyle, styles } from "../content/styles";
import type {
  ColourFacet,
  Density,
  FormFacet,
  PaletteRecord,
  PaletteSize,
  StyleKind,
  StyleRecord,
} from "../content/types";
import { colourDistance } from "./color";

// ——— Style search & filters ———

export type StyleSort = "featured" | "az" | "za";

export interface StyleQuery {
  q: string;
  kinds: StyleKind[];
  colours: ColourFacet[];
  forms: FormFacet[];
  density: Density | null;
  sort: StyleSort;
}

export const emptyStyleQuery: StyleQuery = { q: "", kinds: [], colours: [], forms: [], density: null, sort: "featured" };

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "");

function haystack(s: StyleRecord): string {
  return fold([s.name, ...s.aliases, s.summary, s.about, ...s.tags].join(" \u0001 "));
}
const haystacks = new Map(styles.map((s) => [s.slug, haystack(s)]));

/** Every whitespace-separated term must appear in name, aliases, description or tags. */
export function matchesText(style: StyleRecord, q: string): boolean {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = haystacks.get(style.slug) ?? haystack(style);
  return terms.every((t) => hay.includes(t));
}

/**
 * Filters combine with AND across groups and OR within a group
 * (e.g. Neon OR Pastel, AND Geometric).
 */
export function filterStyles(list: StyleRecord[], query: StyleQuery): StyleRecord[] {
  const out = list.filter(
    (s) =>
      matchesText(s, query.q) &&
      (!query.kinds.length || query.kinds.includes(s.kind)) &&
      (!query.colours.length || query.colours.some((c) => s.colourFacets.includes(c))) &&
      (!query.forms.length || query.forms.some((f) => s.formFacets.includes(f))) &&
      (!query.density || s.density === query.density),
  );
  const byName = (a: StyleRecord, b: StyleRecord) => fold(a.name).localeCompare(fold(b.name));
  if (query.sort === "az") return out.sort(byName);
  if (query.sort === "za") return out.sort((a, b) => byName(b, a));
  return out.sort((a, b) => (a.featured ?? 999) - (b.featured ?? 999) || byName(a, b));
}

// ——— Palette filters ———

export function filterPalettes(list: PaletteRecord[], size: PaletteSize | null, q = ""): PaletteRecord[] {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    if (size && p.colours.length !== size) return false;
    if (!terms.length) return true;
    const hay = fold([p.name, p.mood, p.description, ...p.colours.map((c) => `${c.name} ${c.hex}`)].join(" "));
    return terms.every((t) => hay.includes(t));
  });
}

// ——— Relations ———

/** Average nearest-colour distance between a palette and a style's swatches. */
function paletteFit(p: PaletteRecord, s: StyleRecord): number {
  const total = p.colours.reduce(
    (sum, c) => sum + Math.min(...s.swatches.map((sw) => colourDistance(c.hex, sw.hex))),
    0,
  );
  return total / p.colours.length;
}

export interface PaletteMatch {
  palette: PaletteRecord;
  reason: "curated" | "colour";
}

/** Curated palettes first, then the closest palettes by colour, up to `limit`. */
export function palettesForStyle(style: StyleRecord, limit = 4): PaletteMatch[] {
  const curated = palettes.filter((p) => p.suits.includes(style.slug)).map((p) => ({ palette: p, reason: "curated" as const }));
  if (curated.length >= limit) return curated.slice(0, limit);
  const rest = palettes
    .filter((p) => !p.suits.includes(style.slug))
    .map((p) => ({ p, d: paletteFit(p, style) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit - curated.length)
    .map(({ p }) => ({ palette: p, reason: "colour" as const }));
  return [...curated, ...rest];
}

export function stylesForPalette(p: PaletteRecord): StyleRecord[] {
  return p.suits.map((slug) => getStyle(slug)).filter((s): s is StyleRecord => Boolean(s));
}

export function relatedStyles(style: StyleRecord): StyleRecord[] {
  return style.related.map((slug) => getStyle(slug)).filter((s): s is StyleRecord => Boolean(s));
}

/** Suggestions for unknown slugs: closest names by shared words / prefix. */
export function suggestStyles(input: string, limit = 4): StyleRecord[] {
  const target = fold(input.replace(/[-_]+/g, " "));
  const tWords = target.split(/\s+/).filter(Boolean);
  const scored = styles.map((s) => {
    const names = [s.name, ...s.aliases].map(fold);
    let score = 0;
    for (const n of names) {
      if (n === target) score += 10;
      if (n.startsWith(target.slice(0, 3))) score += 2;
      score += tWords.filter((w) => w.length > 1 && n.includes(w)).length * 3;
    }
    return { s, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

export function suggestPalettes(input: string, limit = 4): PaletteRecord[] {
  const t = fold(input.replace(/[-_]+/g, " "));
  const words = t.split(/\s+/).filter((w) => w.length > 2);
  const hits = palettes.filter((p) => words.some((w) => fold(`${p.name} ${p.mood}`).includes(w)));
  return (hits.length ? hits : palettes.filter((p) => p.featured)).slice(0, limit);
}
