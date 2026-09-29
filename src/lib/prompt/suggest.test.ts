import { describe, expect, it } from "vitest";
import { styles } from "../../content/styles";
import { styleSuggestions } from "./suggest";

describe("palette suggestions for a style", () => {
  it("offers 1, 2, 3 and 4-colour options for every style", () => {
    for (const style of styles) {
      const groups = styleSuggestions(style);
      expect(groups.map((g) => g.size), style.slug).toEqual([1, 2, 3, 4]);
      for (const g of groups) {
        expect(g.options.length, `${style.slug} ${g.size}`).toBeGreaterThan(0);
        expect(g.options.length).toBeLessThanOrEqual(4);
        for (const o of g.options) {
          expect(o.hexes, `${style.slug} ${o.name}`).toHaveLength(g.size);
          for (const h of o.hexes) expect(h).toMatch(/^#[0-9A-F]{6}$/);
        }
        expect(new Set(g.options.map((o) => o.hexes.join())).size).toBe(g.options.length);
      }
    }
  });

  it("leads with the style's own colours, then palettes curated for it", () => {
    const groups = styleSuggestions(styles.find((s) => s.slug === "art-deco")!);
    expect(groups[0]!.options[0]!.name).toMatch(/Art Deco/);
    const two = groups[1]!.options;
    expect(two.some((o) => o.slug === "brass-and-soot")).toBe(true);
  });
});
