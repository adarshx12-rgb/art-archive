import { describe, expect, it } from "vitest";
import { inspiration, inspirationFor } from "./inspiration";
import { allStyles } from "./styles";

describe("inspiration", () => {
  it("covers real styles, each distilled from enough references", () => {
    const slugs = new Set(allStyles.map((s) => s.slug));
    for (const [slug, i] of Object.entries(inspiration)) {
      expect(slugs.has(slug), slug).toBe(true);
      expect(i.studied, slug).toBeGreaterThanOrEqual(10);
      expect(i.moves.length, slug).toBeGreaterThanOrEqual(3);
      expect(i.lettering.moves.length, slug).toBeGreaterThanOrEqual(1);
      expect(i.tells.length, slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps image moves free of lettering, so wordless briefs don't invite text", () => {
    for (const [slug, i] of Object.entries(inspiration))
      for (const m of i.moves) expect(m, slug).not.toMatch(/\b(title|word|words|letter|letters|lettering|type|quote|headline|masthead)\b/i);
  });

  it("gives lettering only when there are words to letter", () => {
    expect(inspirationFor("grunge", true)).toHaveProperty("lettering");
    expect(inspirationFor("grunge", false)).not.toHaveProperty("lettering");
    expect(inspirationFor("grunge", false)).not.toHaveProperty("studied");
    expect(inspirationFor("swiss", true)).toBeNull();
  });
});
