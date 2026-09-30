import { describe, expect, it } from "vitest";
import { getTemplate, textSlots } from "../src/content/templates";
import { cleanIdeas, guideFacts } from "./guide";
import { decodeState } from "../src/lib/prompt/state";

const tpl = getTemplate("art-deco", "poster")!;
const slot = textSlots(tpl)[0]!;
type RawIdea = Parameters<typeof cleanIdeas>[0][number];
const idea = (patch: Partial<RawIdea>): RawIdea => ({ title: "Try this", why: "Because.", kind: "scene", instruction: "put the subject on the left", slot: null, words: null, ...patch });

describe("cleanIdeas", () => {
  it("keeps scene ideas with an instruction and word ideas for real slots", () => {
    const out = cleanIdeas([idea({}), idea({ kind: "words", instruction: null, slot: slot.id, words: "NIGHT TRAIN" })], tpl);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ kind: "words", slot: slot.id, words: "NIGHT TRAIN" });
  });

  it("drops ideas it can't apply", () => {
    const out = cleanIdeas([idea({ instruction: "  " }), idea({ kind: "words", instruction: null, slot: "nope", words: "X" }), idea({ kind: "words", instruction: null, slot: slot.id, words: "" })], tpl);
    expect(out).toEqual([]);
  });

  it("keeps at most four and trims long text", () => {
    const out = cleanIdeas(Array.from({ length: 7 }, () => idea({ title: "x".repeat(300) })), tpl);
    expect(out).toHaveLength(4);
    expect(out[0]!.title.length).toBeLessThanOrEqual(80);
  });
});

describe("guideFacts", () => {
  it("describes the template, the words in use and where subjects are", () => {
    const { state } = decodeState(new URLSearchParams(`s=art-deco&tp=poster&ar=2:3&tt=${encodeURIComponent(`${slot.id}~JAZZ AGE`)}`));
    const facts = guideFacts(state)!;
    expect(facts.format).toBe("Poster");
    expect(facts.template.blocks.find((b) => b.id === slot.id)?.words).toBe("JAZZ AGE");
    expect(facts.subjects).toEqual([]);
  });

  it("has nothing to say without a template", () => {
    expect(guideFacts(decodeState(new URLSearchParams("s=art-deco")).state)).toBeNull();
  });
});
