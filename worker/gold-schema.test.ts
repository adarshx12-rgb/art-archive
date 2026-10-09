import { describe, expect, it } from "vitest";
import { GoldSchema, PLACEHOLDER, compileGold, goldText, type GoldAnswer } from "./gold-schema";

const sections = {
  format: "Gig poster, 4:5 portrait, two-colour photocopy print.",
  ground: "Bone white (#EDE6D6) paper, about 60% of the frame, left open above the figure as a quiet field.",
  hero: "A lone guitarist photocopied huge, blown highlights and solid blacks, cropped at the knees, filling the lower two thirds and leaning into the right edge.",
  layout: "[HEADLINE] stacked tall down the left edge reads first; [DATE] and [DETAIL] sit small in a ruled block bottom-right, aligned to the guitar neck.",
  lettering: "[HEADLINE] in condensed hand-cut capitals with an uneven baseline; [DATE] and [DETAIL] in plain typewriter type.",
  finish: "Coarse photocopy toner, dropped-out greys, slight misregistration of the red layer against the black.",
  avoid: "Avoid: gradients, glossy finishes, centred symmetry and clean digital type.",
};
const gold: GoldAnswer = { quality: "strong", qualityReason: "Confident scale contrast and a disciplined two-colour palette.", kind: "poster", roles: ["headline", "hero", "detail"], textLoad: "light", colours: [{ name: "bone white", hex: "#EDE6D6" }, { name: "signal red", hex: "#D7261E" }], sections };
const record = (id: string, patch: Partial<GoldAnswer> = {}) => ({ id, folders: ["concert-poster"], paths: [`concert-poster/${id}.jpg`], study: { medium: "photograph", structure: "single-focus", density: "balanced" }, gold: { ...gold, ...patch } });
const padded = { ...sections, hero: sections.hero + " " + sections.hero, layout: sections.layout + " " + sections.layout };

describe("gold schema", () => {
  it("accepts a well-formed answer and joins its sections in order", () => {
    expect(GoldSchema.safeParse(gold).success).toBe(true);
    expect(goldText(sections).startsWith("Gig poster, 4:5 portrait, two-colour photocopy print.\nBone white")).toBe(true);
    expect(goldText(sections).endsWith("Avoid: gradients, glossy finishes, centred symmetry and clean digital type.")).toBe(true);
  });

  it("leaves out empty lettering for a wordless design", () => {
    expect(goldText({ ...sections, lettering: "" })).not.toContain("\n\n");
  });

  it("rejects unknown roles and kinds", () => {
    expect(GoldSchema.safeParse({ ...gold, roles: ["tagline"] }).success).toBe(false);
    expect(GoldSchema.safeParse({ ...gold, kind: "banner" }).success).toBe(false);
  });

  it("recognises placeholders, numbered or not", () => {
    expect(PLACEHOLDER.test("[HEADLINE] big")).toBe(true);
    expect(PLACEHOLDER.test("[DETAIL 2] small")).toBe(true);
    expect(PLACEHOLDER.test("[hero] or [FOO]")).toBe(false);
  });
});

describe("compileGold", () => {
  it("keeps strong and ok, drops weak, excluded and duplicate ids", () => {
    const out = compileGold(
      [record("a", { sections: padded }), record("b", { quality: "ok", sections: padded }), record("c", { quality: "weak", sections: padded }), record("d", { sections: padded }), record("a", { sections: padded })],
      new Set(["concert-poster/d.jpg"]),
    );
    expect(out.map((g) => g.id)).toEqual(["a", "b"]);
    expect(out[0]).toMatchObject({ kind: "poster", medium: "photograph", folders: ["concert-poster"], quality: "strong" });
    expect(out[0]!.prompt).toBe(goldText(padded));
  });

  it("drops a gold prompt outside 600–1,600 characters", () => {
    const short = { ...sections, hero: "A guitarist, large.", layout: "Headline left.", lettering: "", finish: "Toner.", ground: "White paper." };
    expect(compileGold([record("e", { sections: short })], new Set())).toEqual([]);
    const long = { ...padded, hero: "x".repeat(1700) };
    expect(compileGold([record("f", { sections: long })], new Set())).toEqual([]);
  });
});
