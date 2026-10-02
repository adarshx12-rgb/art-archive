import { describe, expect, it } from "vitest";
import { craft, craftFor, getCraft } from "./craft";
import { getStyle } from "./styles";

const FACETS = new Set(["restrained", "muted", "earthy", "pastel", "vivid", "neon", "metallic", "dark", "geometric", "organic", "typographic", "ornamental", "photographic", "illustrative", "textured", "digital", "dimensional"]);

describe("craft library", () => {
  it("has unique ids, valid kinds and facets, and short tag labels", () => {
    expect(new Set(craft.map((c) => c.id)).size).toBe(craft.length);
    for (const c of craft) {
      expect(["technique", "device", "furniture", "finish"]).toContain(c.kind);
      expect(c.label.length).toBeLessThanOrEqual(18);
      expect(c.phrase.length).toBeGreaterThan(10);
      for (const s of c.suits) expect(FACETS.has(s)).toBe(true);
    }
  });

  it("is big enough to choose from", () => {
    const count = (k: string) => craft.filter((c) => c.kind === k).length;
    expect(count("technique")).toBeGreaterThanOrEqual(20);
    expect(count("device")).toBeGreaterThanOrEqual(15);
    expect(count("furniture")).toBeGreaterThanOrEqual(12);
    expect(count("finish")).toBeGreaterThanOrEqual(10);
  });

  it("keeps furniture wordless", () => {
    for (const c of craft.filter((x) => x.kind === "furniture")) expect(c.phrase).not.toMatch(/["“”]|\b(reading|saying|text|words?|caption|slogan)\b/i);
  });

  it("looks entries up by id", () => {
    expect(getCraft("halftone-screen")?.kind).toBe("technique");
    expect(getCraft("nope")).toBeUndefined();
  });
});

describe("craftFor", () => {
  it("returns a fixed number of each kind, in kind order", () => {
    const list = craftFor(getStyle("swiss")!);
    expect(list.map((c) => c.kind)).toEqual([...Array(10).fill("technique"), ...Array(8).fill("device"), ...Array(6).fill("furniture"), ...Array(6).fill("finish")]);
  });

  it("puts the techniques that suit the style first", () => {
    const punk = craftFor(getStyle("punk")!).filter((c) => c.kind === "technique").map((c) => c.id);
    expect(punk.slice(0, 4)).toEqual(expect.arrayContaining(["photocopy-blowup", "halftone-screen"]));
    const digital = craftFor(getStyle("cyberminimalism")!).map((c) => c.id);
    expect(digital).toEqual(expect.arrayContaining(["pixel-mosaic-fill", "one-bit-dither"]));
  });
});
