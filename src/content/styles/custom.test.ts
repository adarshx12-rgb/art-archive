import { describe, expect, it } from "vitest";
import { composePrompt } from "../../lib/prompt/compose";
import { decodeState, defaultState, encodeState, styleFor, type BuilderState } from "../../lib/prompt/state";
import { CUSTOM_SLUG, customStyle, customTemplates, getCustomTemplate } from "./custom";

const custom = (template: string | null, text: string, patch: Partial<BuilderState> = {}): BuilderState => ({
  ...defaultState(),
  style: CUSTOM_SLUG,
  customStyle: { template, text },
  subject: "a fox in the snow",
  ...patch,
});

describe("custom styles", () => {
  it("offers the canvas, chalkboard and watercolour templates", () => {
    expect(customTemplates.map((t) => t.id)).toEqual(["canvas", "chalkboard", "watercolour"]);
  });

  it("uses a template's full style when its text is untouched", () => {
    const canvas = getCustomTemplate("canvas")!;
    const style = customStyle({ template: "canvas", text: canvas.text });
    expect(style.slug).toBe(CUSTOM_SLUG);
    expect(style.name).toBe("Canvas");
    expect(style.prompt.cues).toEqual(canvas.style.prompt.cues);
    expect(style.look.texture).toBe(canvas.style.look.texture);
  });

  it("uses edited words verbatim as the cue, keeping only the template's colours", () => {
    const style = customStyle({ template: "chalkboard", text: "  Chalk on a black wall, very dusty.  " });
    expect(style.name).toBe("Custom");
    expect(style.prompt.cues).toEqual(["Chalk on a black wall, very dusty"]);
    expect(style.look.lighting).toBe("");
    expect(style.prompt.avoid).toEqual([]);
    expect(style.swatches).toEqual(getCustomTemplate("chalkboard")!.style.swatches);
  });

  it("starts from a blank look when written from scratch", () => {
    const style = customStyle({ template: null, text: "thick crayon lines" });
    expect(style.prompt.cues).toEqual(["thick crayon lines"]);
    expect(style.look.texture).toBe("");
    expect(style.prompt.avoid).toEqual([]);
  });

  it("resolves through styleFor", () => {
    expect(styleFor(custom(null, "thick crayon lines")).prompt.cues).toEqual(["thick crayon lines"]);
    expect(styleFor({ ...defaultState(), style: "steampunk" }).name).toBe("Steampunk");
  });

  it("composes a prompt with the description and no empty lines", () => {
    const { prompt } = composePrompt(custom(null, "thick crayon lines, scribbled fills", { text: "HELLO" }));
    expect(prompt).toContain("An image of a fox in the snow, in the Custom style.");
    expect(prompt).toContain("Style: thick crayon lines, scribbled fills.");
    expect(prompt).not.toMatch(/Texture:|Lighting:|Avoid:/);
    expect(prompt).toContain('set exactly this text: "HELLO"; spell it exactly');
    expect(prompt).not.toMatch(/ in ;|: \./);
  });

  it("round-trips through the share link", () => {
    const s = custom("watercolour", "loose washes, blooms");
    const { state: back, issues } = decodeState(new URLSearchParams(encodeState(s).toString()));
    expect(issues).toEqual([]);
    expect(back.style).toBe(CUSTOM_SLUG);
    expect(back.customStyle).toEqual({ template: "watercolour", text: "loose washes, blooms" });
  });

  it("ignores unknown templates and caps the description", () => {
    const q = new URLSearchParams({ s: CUSTOM_SLUG, ct: "nope", cs: "x".repeat(900) });
    const { state: back, issues } = decodeState(q);
    expect(back.customStyle.template).toBeNull();
    expect(back.customStyle.text.length).toBe(400);
    expect(issues.length).toBe(1);
  });

  it("does not write custom fields for catalogue styles", () => {
    const q = encodeState({ ...defaultState(), customStyle: { template: "canvas", text: "x" } });
    expect(q.has("cs")).toBe(false);
    expect(q.has("ct")).toBe(false);
  });
});
