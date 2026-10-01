import { describe, expect, it } from "vitest";
import generated from "../../content/templates.generated.json";
import type { StyleTemplate } from "../../content/types";
import { checkTemplate, fillerWords } from "./check";

const templates = generated as StyleTemplate[];
const colours = { background: "#111111", primary: "#F4F2ED", secondary: "#888888", accent: "#E0B040", ink: "#191919", paper: "#F4F2ED" } as const;

describe("template copy", () => {
  it("finds filler words, whole words only", () => {
    expect(fillerWords("An iconic, quintessential layout that evokes the era, honoring Dessau")).toEqual(["iconic", "quintessential", "evokes", "honoring"]);
    expect(fillerWords("Seamless, effortless, uncompromising and curated.")).toEqual(["seamless", "effortless", "uncompromising", "curated"]);
    // Ordinary words that merely contain a stem are fine.
    expect(fillerWords("Front elevation, revoked licence, iconography")).toEqual([]);
  });

  it("flags filler in a template's notes", () => {
    const t = { ...templates[0]!, notes: ["The iconic masthead anchors the top."] };
    expect(checkTemplate(t, colours).map((i) => i.message).join()).toMatch(/note 1 uses filler \(iconic\)/);
  });

  // "Why it works" notes, layout names, sample words and layout prompts are all read by visitors.
  it.each(templates.map((t) => [`${t.style}/${t.format}`, t] as const))("%s has no filler words", (_, t) => {
    const copy = [t.name, t.prompt, ...t.notes, ...t.blocks.map((b) => b.text ?? "")];
    expect(copy.flatMap(fillerWords)).toEqual([]);
  });
});
