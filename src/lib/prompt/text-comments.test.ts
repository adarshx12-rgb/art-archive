import { describe, expect, it } from "vitest";
import { composePrompt } from "./compose";
import { defaultState, encodeState, decodeState, type BuilderState } from "./state";
import { shotCamera } from "../scene/camera";
import { applyLayerEdit } from "../scene/convert";
import { newActor } from "../scene/model";
import { customTemplates } from "../../content/styles/custom";

function wallpaper(): BuilderState {
  const state: BuilderState = {
    ...defaultState(), style: "custom", customStyle: { template: "canvas", text: customTemplates.find((t) => t.id === "canvas")!.text },
    aspect: "16:9", paletteMode: "custom", count: 2,
    custom: ["#0CC04B", "#000000", "#FF0000", "#0000FF"],
    comments: [
      { id: "blend", x: 0.59, y: 0.19, text: "blend the etxt with the background" },
      { id: "fill", x: 0.1, y: 0.39, text: "fill entire canvas with the same text diagaonally" },
    ],
  };
  const camera = shotCamera(state);
  state.actors = [[0.397, 0.275], [0.918, -0.025], [0.076, 0.275], [0.31, 0.088], [0.397, -0.043]].map(([x, y]) =>
    applyLayerEdit(camera, { ...newActor("text", "what the chat", []), scale: 0.54 }, { x, y, rotation: -23.1 }));
  return state;
}

describe("text comments override only the requested layout properties", () => {
  it("fills a landscape canvas and blends every repeated copy despite upper-left pins and typos", () => {
    const original = wallpaper();
    const { state, issues } = decodeState(encodeState(original));
    const { prompt, notes } = composePrompt(state);
    expect(issues).toEqual([]);
    expect(state.aspect).toBe("16:9");
    expect(prompt).toContain("16:9 widescreen frame");
    expect(prompt).toContain('Text pattern: Fill the entire canvas edge to edge with repeating "what the chat"');
    expect(prompt).toContain("23.1 degrees counterclockwise, rising to the right");
    expect(prompt).toContain("Continue through the top, middle and bottom and beyond all four edges");
    expect(prompt).toContain('Blend every repetition of "what the chat" across the whole pattern');
    expect(prompt).toContain("Apply the same opacity and tonal treatment to all copies");
    expect(prompt).not.toMatch(/Text layout:|Text element \d:|Leave unoccupied areas empty/);
    expect(prompt).toContain("#0CC04B");
    expect(prompt).toContain("#000000");
    expect(notes.join(" ")).toContain("Comment 2 fills the canvas");
    expect(state.actors).toHaveLength(5);
  });

  it("still locks five placements when there is no fill request", () => {
    const state = wallpaper();
    state.comments = [];
    expect(composePrompt(state).prompt).toContain("Text layout: exactly 5 placed text elements");
    state.comments = [{ id: "no", x: 0, y: 0, text: "do not fill the entire canvas with the same text" }];
    const { prompt } = composePrompt(state);
    expect(prompt).not.toContain("Text pattern:");
    expect(prompt).toContain("Leave unoccupied areas empty");
  });

  it("preserves unrelated lettering and any extra comment wording", () => {
    const state = wallpaper();
    state.comments[1]!.text += "; keep a soft edge on the letters";
    state.actors.push(applyLayerEdit(shotCamera(state), newActor("text", "SIDE NOTE", []), { x: 0.9, y: 0.9 }));
    // The pin explicitly names its target when there are multiple phrases.
    state.comments[1]!.text += ' using "what the chat"';
    const { prompt } = composePrompt(state);
    expect(prompt).toContain("Preserve these 1 separate text elements");
    expect(prompt).toContain('Text element 1: "SIDE NOTE"');
    expect(prompt).not.toContain("Leave unoccupied areas empty");
    expect(prompt).toContain("keep a soft edge on the letters");
  });

  it("honours an explicitly local blend without making the whole pattern translucent", () => {
    const state = wallpaper();
    state.comments[0]!.text = "blend only this text with the background";
    const { prompt } = composePrompt(state);
    expect(prompt).toContain('Blend only the copy of "what the chat" at the marked location');
    expect(prompt).not.toContain("Apply the same opacity");
  });

  it("does not infer a text pattern for a background-only instruction or an empty board", () => {
    const state = wallpaper();
    state.comments = [{ id: "green", x: 0.5, y: 0.5, text: "fill the entire canvas with green" }];
    expect(composePrompt(state).prompt).not.toContain("Text pattern:");
    state.comments = wallpaper().comments;
    state.actors = [];
    expect(composePrompt(state).prompt).not.toContain("Text pattern:");
  });
});
