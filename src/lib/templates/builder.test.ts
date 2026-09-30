import { describe, expect, it } from "vitest";
import { getTemplate, textSlots } from "../../content/templates";
import { composePrompt } from "../prompt/compose";
import { decodeState, defaultState, encodeState } from "../prompt/state";

// Art Deco's magazine template is part of the draft set.
const tpl = getTemplate("art-deco", "magazine")!;
const slot = textSlots(tpl)[0]!;

describe("templates in the builder", () => {
  it("round-trips the template and the visitor's words through a share link", () => {
    const state = { ...defaultState(), style: "art-deco", aspect: "4:5" as const, template: "magazine" as const, templateText: { [slot.id]: "THE GILDED | ISSUE~" } };
    const back = decodeState(encodeState(state)).state;
    expect(back.template).toBe("magazine");
    expect(back.templateText[slot.id]).toBe("THE GILDED ISSUE");
  });

  it("drops a template the style doesn't have, and says so", () => {
    const { state, issues } = decodeState(new URLSearchParams("s=art-deco&tp=billboard"));
    expect(state.template).toBeNull();
    expect(issues.join()).toMatch(/template/i);
  });

  it("ignores words for slots the template doesn't have", () => {
    const { state } = decodeState(new URLSearchParams(`s=art-deco&tp=magazine&tt=${encodeURIComponent("nope~Hello")}`));
    expect(state.templateText).toEqual({});
  });

  it("adds the layout and spells every slot's words in the prompt", () => {
    const state = { ...defaultState(), style: "art-deco", aspect: "4:5" as const, template: "magazine" as const, templateText: { [slot.id]: "MIDNIGHT EXPRESS" } };
    const { prompt } = composePrompt(state);
    expect(prompt).toMatch(/Design:/);
    expect(prompt).toContain('"MIDNIGHT EXPRESS"');
    // Unchanged slots keep their sample words.
    const other = textSlots(tpl)[1];
    if (other) expect(prompt).toContain(`"${other.text}"`);
  });
});
