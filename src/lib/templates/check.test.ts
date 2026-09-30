import { describe, expect, it } from "vitest";
import type { StyleTemplate, TemplateBlock } from "../../content/types";
import { checkTemplate, estimateLines } from "./check";

const colours = { background: "#111111", primary: "#F4F2ED", secondary: "#888888", accent: "#E0B040", ink: "#191919", paper: "#F4F2ED" } as const;

const text = (patch: Partial<TemplateBlock>): TemplateBlock => ({ id: "headline", kind: "headline", x: 0.1, y: 0.1, w: 0.8, h: 0.12, text: "Big news", label: "Headline", font: "Inter", weight: 700, size: 0.08, colour: "primary", ...patch });
const image: TemplateBlock = { id: "image", kind: "image", x: 0, y: 0.3, w: 1, h: 0.7 };

const tpl = (blocks: TemplateBlock[], patch: Partial<StyleTemplate> = {}): StyleTemplate => ({
  style: "art-deco",
  format: "poster",
  name: "Test",
  notes: ["a"],
  background: "background",
  blocks,
  prompt: "Headline {headline} at the top.",
  ...patch,
});

const messages = (t: StyleTemplate) => checkTemplate(t, colours).map((i) => i.message);

describe("checkTemplate", () => {
  it("passes a clean layout", () => {
    expect(messages(tpl([image, text({})]))).toEqual([]);
  });

  it("flags text outside the safe margin", () => {
    expect(messages(tpl([image, text({ x: 0.5, w: 0.6 })])).join()).toMatch(/outside/);
  });

  it("flags text blocks that overlap each other", () => {
    const sub = text({ id: "sub", kind: "subhead", y: 0.15, label: "Subhead", text: "More" });
    expect(messages(tpl([image, text({}), sub])).join()).toMatch(/overlap/);
  });

  it("flags low contrast against what the text sits on", () => {
    expect(messages(tpl([image, text({ colour: "background" })])).join()).toMatch(/contrast/);
  });

  it("reads contrast against a shape the text sits on", () => {
    const plate: TemplateBlock = { id: "plate", kind: "shape", shape: "rect", x: 0.05, y: 0.05, w: 0.9, h: 0.2, fill: "accent" };
    // Light text on the gold plate is weak; dark text on it is fine.
    expect(messages(tpl([image, plate, text({ colour: "primary" })])).join()).toMatch(/contrast/);
    expect(messages(tpl([image, plate, text({ colour: "background" })]))).toEqual([]);
  });

  it("flags text too long for its box", () => {
    expect(messages(tpl([image, text({ text: "An extremely long headline that cannot possibly fit on one short line here", h: 0.09 })])).join()).toMatch(/fit/);
  });

  it("judges rotated blocks by where they really land", () => {
    // A tall thin box tipped to horizontal: its unrotated box pokes out top and bottom, the real line doesn't.
    const line: TemplateBlock = { id: "line", kind: "shape", shape: "rect", fill: "accent", x: 0.4, y: -0.1, w: 0.004, h: 0.6, rotate: 90 };
    expect(messages(tpl([image, line, text({})]))).toEqual([]);
    // Tipped the other way it really would sweep off both sides.
    const long: TemplateBlock = { ...line, x: 0.5, y: 0.2, h: 0.4, rotate: 90, w: 0.004 };
    expect(messages(tpl([image, { ...long, h: 1.6, y: -0.3 }, text({})])).join()).toMatch(/off the canvas/);
  });

  it("requires the format's key parts", () => {
    expect(messages(tpl([text({})], { format: "magazine" })).join()).toMatch(/masthead/);
  });

  it("keeps thumbnail text short and the duration corner clear", () => {
    const t = tpl([image, text({ text: "Six words is far too many", w: 0.5, h: 0.4, size: 0.08 }), text({ id: "tag", kind: "meta", label: "Tag", text: "NEW", x: 0.85, y: 0.85, w: 0.1, h: 0.08, size: 0.05 })], { format: "thumbnail" });
    const m = messages(t).join();
    expect(m).toMatch(/words/);
    expect(m).toMatch(/corner/);
  });

  it("flags prompt slots that name no block", () => {
    expect(messages(tpl([image, text({})], { prompt: "Title {title}." })).join()).toMatch(/\{title\}/);
  });
});

describe("estimateLines", () => {
  it("wraps long text", () => {
    expect(estimateLines("short", 0.08, 0.8, 1)).toBe(1);
    expect(estimateLines("a much longer line of words that has to wrap", 0.08, 0.5, 1)).toBeGreaterThan(2);
  });

  it("starts a new line at each line break", () => {
    // Fits on one line without the break.
    expect(estimateLines("ONE TWO", 0.05, 0.9, 1)).toBe(1);
    expect(estimateLines("ONE\nTWO", 0.05, 0.9, 1)).toBe(2);
    expect(estimateLines("ONE\n\nTWO THREE", 0.05, 0.9, 1)).toBe(3);
  });
});
