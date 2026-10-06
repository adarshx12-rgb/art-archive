import { describe, expect, it } from "vitest";
import { decodeState } from "../prompt/state";
import { incompatibleCraft, sourceColourConflict } from "./constraints";

const state = (query: string) => decodeState(new URLSearchParams(query)).state;

describe("explicit rendering constraints", () => {
  it("keeps rough and dotted techniques out of explicitly smooth lettering", () => {
    const conflicts = incompatibleCraft(state("s=custom&cs=Smooth+anti-aliased+lettering+on+a+flat+ground"));
    expect(conflicts.has("halftone-screen")).toBe(true);
    expect(conflicts.has("linocut")).toBe(true);
    expect(conflicts.has("smooth-lettering")).toBe(false);
    expect(conflicts.has("uniform-repeat")).toBe(false);
  });
  it("allows textured aesthetics unless the user explicitly rules them out", () => {
    expect(incompatibleCraft(state("s=grunge")).size).toBe(0);
    expect(incompatibleCraft(state("s=custom&cs=No+smooth+lettering.+Rough+ink+type.")).size).toBe(0);
    expect(incompatibleCraft(state("s=custom&cs=Photography.+No+print+texture.")).has("photocopy-blowup")).toBe(true);
  });
  it("catches palette replacement and invented substrates, but not prohibitions or quoted words", () => {
    expect(sourceColourConflict("Reduce the image to a single dark ink.")).toBe(true);
    expect(sourceColourConflict("Black ink outlines on yellowed paper.")).toBe(true);
    expect(sourceColourConflict('Letter "Black Ink" in the existing darkest tone.')).toBe(false);
    expect(sourceColourConflict("Keep existing colours. No white paper or black ink outlines.")).toBe(false);
    expect(sourceColourConflict("Keep the existing darkest and lightest source tones.")).toBe(false);
  });
  it("does not suggest a replacement ink palette for a colour-preserving restyle", () => {
    const conflicts = incompatibleCraft(state("s=pop-art&t=restyle&k=colours"));
    expect(conflicts.has("duotone")).toBe(true);
    expect(conflicts.has("halftone-screen")).toBe(false);
  });
});
