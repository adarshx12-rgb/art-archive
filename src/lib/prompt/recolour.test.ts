import { describe, expect, it } from "vitest";
import { colourSwaps, recolourText } from "./recolour";
import { getStyle } from "../../content/styles";
import type { ResolvedPalette } from "./compose";

const blueprint = getStyle("blueprint")!;
const palette = (hexes: [string, string][]): ResolvedPalette => ({
  source: "custom",
  label: "Custom palette",
  colours: hexes.map(([hex, name], i) => ({ hex: hex as `#${string}`, name, role: (["background", "primary", "accent"] as const)[i]!, share: 10 })),
});

describe("recolouring a style's words", () => {
  const swaps = colourSwaps(palette([["#0B0B0B", "black"], ["#A6E22E", "yellow-green"], ["#FFFFFF", "off-white"]]), blueprint);

  it("maps the style's colours role for role, and the rest to the nearest in lightness", () => {
    expect(swaps.map((s) => [s.from, s.to.name])).toEqual([
      ["Prussian blue", "black"],
      ["chalk white", "yellow-green"],
      ["faded blue", "off-white"],
      ["deep blue", "black"],
    ]);
  });

  it("replaces full names, and bare colour words by the first swatch they end", () => {
    expect(recolourText("fine white technical linework on Prussian blue", swaps)).toBe("fine yellow-green technical linework on black");
    expect(recolourText("Faded blue edges, deep blue shadows", swaps)).toBe("off-white edges, black shadows");
    expect(recolourText("a white-hot line", swaps)).toBe("a white-hot line");
  });

  it("does nothing for the style's own palette or a palette of its colours", () => {
    expect(colourSwaps({ ...palette([]), source: "style" }, blueprint)).toEqual([]);
    expect(colourSwaps(palette([["#1B3F7A", "blue"], ["#EAF1FA", "white"]]), blueprint)).toEqual([]);
  });

  it("with one colour, swaps only the ground; the style keeps its other colours", () => {
    expect(colourSwaps(palette([["#0B0B0B", "black"]]), blueprint).map((s) => s.from)).toEqual(["Prussian blue"]);
  });
});
