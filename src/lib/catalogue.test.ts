import { describe, expect, it } from "vitest";
import { palettes } from "../content/palettes";
import { coverPrompts, promptForImage } from "../content/coverPrompts";
import { covers, similarCovers } from "../content/covers";
import { fontSuggestions } from "../content/fonts";
import { references } from "../content/references";
import { styles } from "../content/styles";
import { renderers } from "../art/studies";
import { describeHex, normaliseHex } from "./color";
import { emptyStyleQuery, filterPalettes, filterStyles, palettesForStyle, suggestStyles } from "./catalogue";
import { parseSaved } from "./storage";

describe("content integrity", () => {
  it("has 63 styles with unique slugs", () => {
    expect(styles).toHaveLength(63);
    expect(new Set(styles.map((s) => s.slug)).size).toBe(styles.length);
  });

  it("every style is complete and links resolve", () => {
    const slugs = new Set(styles.map((s) => s.slug));
    const refIds = new Set(references.map((r) => r.id));
    for (const s of styles) {
      expect(s.swatches, s.slug).toHaveLength(4);
      s.swatches.forEach((sw) => expect(normaliseHex(sw.hex), s.slug).toBe(sw.hex.toUpperCase()));
      expect(s.prompt.cues.length, s.slug).toBeGreaterThanOrEqual(5);
      expect(s.tags.length, s.slug).toBeGreaterThanOrEqual(3);
      s.related.forEach((r) => expect(slugs.has(r), `${s.slug} → ${r}`).toBe(true));
      expect(s.related).not.toContain(s.slug);
      s.references.forEach((r) => expect(refIds.has(r), `${s.slug} → ${r}`).toBe(true));
      expect(renderers[s.art.renderer ?? s.slug], `renderer for ${s.slug}`).toBeTypeOf("function");
    }
  });

  it("every cover belongs to a style and exists in public/", () => {
    const slugs = new Set(styles.map((s) => s.slug));
    const files = new Set(Object.keys(import.meta.glob("/public/covers/*.webp")).map((f) => f.slice("/public".length)));
    for (const [slug, cover] of Object.entries(covers)) {
      expect(slugs.has(slug), `cover slug ${slug}`).toBe(true);
      for (const c of [cover, ...similarCovers(slug)]) expect(files.has(c.src), c.src).toBe(true);
    }
    expect(Object.keys(covers).length).toBeGreaterThanOrEqual(30);
    // Image 2 is the main cover; the others are similar covers.
    expect(covers["italo-disco"]?.src).toBe("/covers/italo-disco.webp");
    expect(similarCovers("italo-disco").map((c) => c.src)).toEqual(["/covers/italo-disco-1.webp"]);
  });

  it("parses a cover prompt for real styles from docs/cover-prompts.md", () => {
    const slugs = new Set(styles.map((s) => s.slug));
    const entries = Object.values(coverPrompts);
    // One prompt per style, however many have been written so far.
    expect(entries.length).toBeGreaterThanOrEqual(32);
    expect(new Set(entries.map((c) => c.slug)).size).toBe(entries.length);
    for (const c of entries) {
      expect(slugs.has(c.slug), `cover prompt slug ${c.slug}`).toBe(true);
      expect(c.prompt, c.slug).not.toContain("```");
      expect(c.artwork && c.format, c.slug).toBeTruthy();
    }
    expect(coverPrompts.swiss?.prompt).toMatch(/^An original 1962 Swiss concert poster/);
  });

  it("links every cover image to the prompt that made it", () => {
    for (const [slug, main] of Object.entries(covers)) {
      // The live prompt in cover-prompts.md is the one behind the main cover.
      expect(coverPrompts[slug]?.cover, `live prompt for ${slug}`).toBe(main.file);
      for (const c of similarCovers(slug)) expect(promptForImage(c.file)?.slug, c.file).toBe(slug);
    }
    expect(promptForImage("gothic2.png")?.artwork).toMatch(/novel binding/);
  });

  it("suggests free and paid fonts for every style with a cover", () => {
    const slugs = new Set(styles.map((s) => s.slug));
    for (const slug of Object.keys(covers)) {
      const fonts = fontSuggestions[slug] ?? [];
      expect(fonts.some((f) => f.licence === "free"), `free fonts for ${slug}`).toBe(true);
      expect(fonts.some((f) => f.licence === "paid"), `paid fonts for ${slug}`).toBe(true);
      expect(new Set(fonts.map((f) => f.family)).size, `duplicate font in ${slug}`).toBe(fonts.length);
    }
    for (const slug of Object.keys(fontSuggestions)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("style content is genuinely distinct between entries", () => {
    const summaries = new Set(styles.map((s) => s.summary));
    const firstCues = new Set(styles.map((s) => s.prompt.cues[0]));
    expect(summaries.size).toBe(styles.length);
    expect(firstCues.size).toBe(styles.length);
  });

  it("has at least 18 palettes spread across 2, 3 and 4 colours, shares totalling 100", () => {
    expect(palettes.length).toBeGreaterThanOrEqual(18);
    const slugs = new Set(styles.map((s) => s.slug));
    for (const size of [2, 3, 4]) {
      expect(palettes.filter((p) => p.colours.length === size).length).toBeGreaterThanOrEqual(6);
    }
    for (const p of palettes) {
      expect(p.colours.reduce((a, c) => a + c.share, 0), p.slug).toBe(100);
      p.suits.forEach((s) => expect(slugs.has(s), `${p.slug} → ${s}`).toBe(true));
    }
    expect(new Set(palettes.map((p) => p.slug)).size).toBe(palettes.length);
  });

  it("references carry licence and source metadata", () => {
    for (const r of references) {
      expect(r.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      expect(r.licence).toBeTruthy();
      expect(r.alt.length).toBeGreaterThan(20);
      expect(r.width).toBeGreaterThan(0);
    }
  });
});

describe("style filtering", () => {
  it("searches name, alias, description and tags", () => {
    const f = (q: string) => filterStyles(styles, { ...emptyStyleQuery, q }).map((s) => s.slug);
    expect(f("international typographic")).toContain("swiss"); // alias
    expect(f("Jugendstil")).toContain("art-nouveau"); // alias
    expect(f("gears")).toContain("steampunk"); // description / cues
    expect(f("ransom-note")).toContain("punk"); // tag
    expect(f("graffitti")).toContain("graffiti"); // user's spelling kept as alias
    expect(f("naive")).toContain("naive"); // diacritics folded
  });

  it("combines search with filters (AND across groups, OR within)", () => {
    const r = filterStyles(styles, { ...emptyStyleQuery, q: "chrome", colours: ["neon"] });
    expect(r.length).toBeGreaterThan(0);
    r.forEach((s) => expect(s.colourFacets).toContain("neon"));
    const two = filterStyles(styles, { ...emptyStyleQuery, colours: ["neon", "pastel"] });
    two.forEach((s) => expect(s.colourFacets.some((c) => c === "neon" || c === "pastel")).toBe(true));
    const kinds = filterStyles(styles, { ...emptyStyleQuery, kinds: ["interface"], density: "sparse" });
    kinds.forEach((s) => {
      expect(s.kind).toBe("interface");
      expect(s.density).toBe("sparse");
    });
  });

  it("sorts alphabetically and by featured", () => {
    const az = filterStyles(styles, { ...emptyStyleQuery, sort: "az" }).map((s) => s.name);
    expect(az[0]).toMatch(/^70/);
    const featured = filterStyles(styles, emptyStyleQuery);
    expect(featured[0]!.slug).toBe("swiss");
  });

  it("returns empty for nonsense", () => {
    expect(filterStyles(styles, { ...emptyStyleQuery, q: "qwertyuiop" })).toEqual([]);
  });
});

describe("palette filtering", () => {
  it("2/3/4 filters return only palettes of exactly that size", () => {
    for (const n of [2, 3, 4] as const) {
      const r = filterPalettes(palettes, n);
      expect(r.length).toBeGreaterThan(0);
      r.forEach((p) => expect(p.colours).toHaveLength(n));
    }
    expect(filterPalettes(palettes, null)).toHaveLength(palettes.length);
  });

  it("every style gets compatible palettes", () => {
    for (const s of styles) expect(palettesForStyle(s).length, s.slug).toBe(4);
  });
});

describe("misc", () => {
  it("suggests styles for near-miss slugs", () => {
    expect(suggestStyles("art-dec").map((s) => s.slug)).toContain("art-deco");
    expect(suggestStyles("steam").map((s) => s.slug)).toContain("steampunk");
  });

  it("describes colours in words", () => {
    expect(describeHex("#1B3F7A")).toMatch(/blue|navy/);
    expect(describeHex("#F4F2ED")).toMatch(/off-white/);
    expect(describeHex("#DFFF70")).toMatch(/yellow/);
  });

  it("parses malformed saved data safely", () => {
    const known = { styles: new Set(["swiss"]), palettes: new Set(["acid-night"]) };
    expect(parseSaved("{not json", known)).toEqual({ styles: [], palettes: [] });
    expect(parseSaved("[1,2]", known)).toEqual({ styles: [], palettes: [] });
    expect(parseSaved('{"styles":"swiss"}', known)).toEqual({ styles: [], palettes: [] });
    expect(parseSaved('{"styles":["swiss","swiss","gone"],"palettes":["acid-night",4]}', known)).toEqual({
      styles: ["swiss"],
      palettes: ["acid-night"],
    });
  });
});
