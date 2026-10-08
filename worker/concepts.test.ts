import { describe, expect, it } from "vitest";
import type { Brief } from "../src/lib/art/brief";
import { decodeState } from "../src/lib/prompt/state";
import { imageActor } from "../src/lib/scene/model";
import { conceptFacts, sortBriefs } from "./concepts";
import { basePlan } from "../src/lib/plan/plan";

const state = decodeState(new URLSearchParams("s=punk&fm=poster&tx=Night%20Shift&sc=" + encodeURIComponent("person~woman dancing~0~0~0~0~0~0~1~dance~1"))).state;
const brief = (title: string, craft: string[], patch: Partial<Brief> = {}): Brief => ({
  title,
  idea: "An idea.",
  hero: { subject: "woman dancing", treatment: "photocopied huge", scale: "cropped at the knees" },
  device: "torn top to bottom",
  furniture: [],
  type: '"Night Shift" across the tear',
  colour: null,
  finish: "toner specks",
  craft,
  motion: null,
  ...patch,
});

describe("conceptFacts", () => {
  it("gives the model the style, format, subjects, words, palette and craft shortlist", () => {
    const f = conceptFacts(state, ["Old idea"])!;
    expect(f.task).toBe("create");
    expect(f.style.name).toBe("Punk");
    expect(f.format?.name).toBe("Poster");
    expect(f.subjects.map((s) => s.label)).toEqual(["woman dancing"]);
    expect(f.words).toEqual(["Night Shift"]);
    expect(Array.isArray(f.palette) && f.palette[0]!.hex).toBe("#F0EEE7");
    expect(f.craft.length).toBeLessThanOrEqual(33);
    expect(new Set(f.craft.map((c) => c.id)).size).toBe(f.craft.length);
    expect(f.craft.some((c) => c.id === "smooth-lettering")).toBe(true);
    expect(f.designMemory.references.length).toBeGreaterThan(0);
    expect(f.alreadyShown).toEqual(["Old idea"]);
  });

  it("offers no lettering devices when the visitor typed no words", () => {
    const silent = decodeState(new URLSearchParams("s=swiss&fm=poster&q=a%20cat")).state;
    expect(conceptFacts(silent, [])!.craft.map((c) => c.id)).not.toEqual(expect.arrayContaining(["giant-glyph"]));
    expect(conceptFacts(silent, [])!.craft.some((c) => ["giant-glyph", "stacked-column", "type-behind", "type-as-image"].includes(c.id))).toBe(false);
  });

  it("gives the director the content plan: the rules plan by default, or the one passed in", () => {
    const poster = decodeState(new URLSearchParams("s=swiss&fm=poster&q=a%20cat&tx=" + encodeURIComponent("Cat Show\nSunday 10am"))).state;
    expect(conceptFacts(poster, [])!.plan).toEqual(basePlan(poster));
    const planned = { ...basePlan(poster), message: "A cat show this Sunday.", source: "ai" as const };
    expect(conceptFacts(poster, [], planned)!.plan).toBe(planned);
    const restyle = decodeState(new URLSearchParams("s=swiss&t=restyle&k=composition&q=a%20cat")).state;
    expect(conceptFacts(restyle, [])!.plan.layout).toBe("preserve");
  });

  it("treats a text-source picture as words: lettering devices on, sources named", () => {
    const silent = decodeState(new URLSearchParams("s=swiss&fm=poster")).state;
    const withSource = { ...silent, actors: [imageActor({ key: "k", ratio: 1, use: "text" }, [])] };
    const facts = conceptFacts(withSource, [])!;
    expect(facts.textSources).toEqual(["image 1"]);
    expect(facts.craft.some((c) => c.id === "smooth-lettering")).toBe(true);
    expect(conceptFacts(silent, [])!.textSources).toEqual([]);
  });

  it("passes the style's inspiration, with lettering moves only when there are words", () => {
    const worded = decodeState(new URLSearchParams("s=grunge&fm=poster&q=a%20boxer&tx=Last%20Round")).state;
    const silent = decodeState(new URLSearchParams("s=grunge&fm=poster&q=a%20boxer")).state;
    expect(conceptFacts(worded, [])!.inspiration?.moves.length).toBeGreaterThan(0);
    expect(conceptFacts(worded, [])!.inspiration).toHaveProperty("lettering");
    expect(conceptFacts(silent, [])!.inspiration).not.toHaveProperty("lettering");
    expect(conceptFacts(state, [])!.inspiration).toBeNull();
  });

  it("adds motion notes to craft phrases for video", () => {
    const video = decodeState(new URLSearchParams("s=punk&o=video&q=a%20dancer")).state;
    expect(conceptFacts(video, [])!.craft.find((c) => c.id === "photocopy-blowup")!.phrase).toMatch(/in motion: copier flicker/);
  });
});

describe("sortBriefs", () => {
  it("keeps valid, distinct concepts and lists the problems of the rest", () => {
    const { kept, problems } = sortBriefs(
      [
        brief("Torn", ["photocopy-blowup", "torn-split"]),
        brief("Dragon", ["halftone-screen"], { hero: { subject: "a dragon", treatment: "x", scale: null } }),
        brief("Torn again", ["photocopy-blowup", "torn-split"]),
      ],
      state,
    );
    expect(kept.map((b) => b.title)).toEqual(["Torn"]);
    expect(problems.join(" ")).toMatch(/Concept 2: The hero must be/);
    expect(problems.join(" ")).toMatch(/Concept 3: .*genuinely different/);
  });

  it("adds to concepts already kept, up to three", () => {
    const start = [brief("A", ["halftone-screen", "cutout-window"])];
    const { kept } = sortBriefs([brief("B", ["duotone", "single-band"]), brief("C", ["one-bit-dither", "repeat-grid"]), brief("D", ["linocut", "stamp-frame"])], state, start);
    expect(kept.map((b) => b.title)).toEqual(["A", "B", "C"]);
  });

  it("asks for three when fewer came back", () => {
    expect(sortBriefs([brief("Only", ["duotone"])], state).problems).toContain("Write exactly three concepts.");
  });
});
