import { afterEach, describe, expect, it } from "vitest";
import { basePlan } from "../src/lib/plan/plan";
import { defaultState, type BuilderState } from "../src/lib/prompt/state";
import type { GoldReference } from "./gold-schema";
import { copiedRun, goldById, goldForModel, placeholdersLeft, referenceColours, retrieveGold, setGoldPool } from "./gold";

const sections = {
  format: "Fight night poster, 4:5 portrait.",
  ground: "Tar black (#141414) ground, about 60%, scuffed like a wall.",
  hero: "A boxer photocopied huge, blown highlights, cropped at the shoulders, filling the lower two thirds.",
  layout: "[HEADLINE] huge across the top third, the boxer's head covering its lower edge; [OFFER] in a torn tape strip bottom-left.",
  lettering: "[HEADLINE] in hand-cut stencil capitals; [OFFER] in typewriter type.",
  finish: "Coarse toner grain, dropped-out greys, a few tape marks.",
  avoid: "Avoid: gradients, glossy finishes and clean vector type.",
};

function ref(id: string, patch: Partial<GoldReference> = {}): GoldReference {
  const base: GoldReference = { id, folders: ["grunge"], kind: "poster", roles: ["headline", "hero"], textLoad: "light", medium: "photograph", structure: "single-focus", density: "balanced", quality: "ok", colours: [{ name: "tar black", hex: "#141414" }], sections, prompt: "" };
  const out = { ...base, ...patch };
  return { ...out, prompt: patch.prompt ?? Object.values(out.sections).join("\n") };
}

const grunge = (patch: Partial<BuilderState> = {}): BuilderState => ({ ...defaultState(), style: "grunge", format: "poster", ...patch });

afterEach(() => setGoldPool(null));

describe("retrieveGold", () => {
  it("prefers the reference whose roles match the plan, among the same style", () => {
    const state = grunge({ text: "Last Round\nRM 20 entry\nBook now" });
    const pool = [ref("plain"), ref("flyer", { kind: "flyer" }), ref("match", { roles: ["headline", "offer", "cta", "hero"] })];
    const picked = retrieveGold(state, basePlan(state), pool);
    expect(picked[0]!.gold.id).toBe("match");
    expect(picked[0]!.transfer).toBe("within-style");
    expect(new Set(picked.map((p) => p.gold.id)).size).toBe(picked.length);
  });

  it("prefers the plan's design kind", () => {
    const state = grunge({ format: "flyer", text: "Last Round" });
    const picked = retrieveGold(state, basePlan(state), [ref("poster"), ref("flyer", { kind: "flyer" })]);
    expect(picked[0]!.gold.id).toBe("flyer");
  });

  it("returns at most three", () => {
    const state = grunge({ subject: "a boxer" });
    expect(retrieveGold(state, basePlan(state), ["a", "b", "c", "d", "e"].map((id) => ref(id)))).toHaveLength(3);
  });

  it("borrows another style only when its structure fits, and marks it structure-only", () => {
    const state = grunge({ subject: "a boxer" });
    const plan = basePlan(state);
    expect(retrieveGold(state, plan, [ref("x", { folders: ["concert-poster"], structure: "repetition", medium: "graphic" })])).toEqual([]);
    const picked = retrieveGold(state, plan, [ref("y", { folders: ["concert-poster"] })]);
    expect(picked.map((p) => [p.gold.id, p.transfer])).toEqual([["y", "structure-only"]]);
  });

  it("returns nothing for an empty pool, or a wordless brief against type-only references", () => {
    const state = grunge({ subject: "a boxer" });
    expect(retrieveGold(state, basePlan(state), [])).toEqual([]);
    expect(retrieveGold(state, basePlan(state), [ref("t", { medium: "typography", structure: "type-led", textLoad: "heavy" })])).toEqual([]);
  });

  it("reads the compiled pool by default, which tests can replace", () => {
    const state = grunge({ subject: "a boxer" });
    setGoldPool([ref("injected")]);
    expect(retrieveGold(state, basePlan(state))[0]!.gold.id).toBe("injected");
  });
});

describe("goldForModel", () => {
  it("numbers the references and strips a cross-style one to its hero and layout", () => {
    const state = grunge({ subject: "a boxer" });
    const picked = retrieveGold(state, basePlan(state), [ref("own", { quality: "strong" }), ref("other", { folders: ["concert-poster"] })]);
    const sent = goldForModel(picked);
    expect(sent.map((g) => g.ref)).toEqual(["G1", "G2"]);
    const own = sent.find((g) => g.transfer === "within-style")!;
    const other = sent.find((g) => g.transfer === "structure-only")!;
    expect(own.prompt).toContain(sections.finish);
    expect(other.prompt).toContain(sections.layout);
    expect(other.prompt).toContain(sections.hero);
    expect(other.prompt).not.toContain(sections.finish);
    expect(other.prompt).not.toContain(sections.lettering);
    expect(other.prompt).not.toContain("#141414");
  });
});

describe("gold checks", () => {
  const g = ref("chk", { colours: [{ name: "tar black", hex: "#141414" }, { name: "safety orange", hex: "#FF6A00" }] });

  it("finds placeholders left in a prompt", () => {
    expect(placeholdersLeft("[HEADLINE] big, [DETAIL 2] small, [hero] fine")).toEqual(["[HEADLINE]", "[DETAIL 2]"]);
    expect(placeholdersLeft('"Last Round" big')).toEqual([]);
  });

  it("finds the reference's colours outside the Avoid line, unless the visitor chose them", () => {
    const p = "Safety orange (#FF6A00) tape across the top.\nAvoid: tar black backgrounds.";
    expect(referenceColours(p, g, ["#F0EEE7", "xerox white"])).toEqual(["safety orange", "#FF6A00"]);
    expect(referenceColours(p, g, ["#FF6A00", "safety orange"])).toEqual([]);
    expect(referenceColours("Avoid: safety orange.", g, [])).toEqual([]);
  });

  it("finds a long run copied from the reference", () => {
    const run = sections.hero.split(" ").slice(0, 12).join(" ");
    expect(copiedRun(`Intro. ${run} and more.`, g)).toBe(run.toLowerCase().replace(/[^a-z0-9 ]/g, ""));
    expect(copiedRun(sections.hero.split(" ").slice(0, 11).join(" "), g)).toBeNull();
  });

  it("finds a compiled gold prompt by id", () => {
    setGoldPool([g]);
    expect(goldById("chk")).toBe(g);
    expect(goldById("nope")).toBeUndefined();
  });
});
