import { describe, expect, it } from "vitest";
import { fillText, needsLayout } from "./instruction";

describe("needsLayout", () => {
  it("keeps simple subjects local", () => {
    for (const s of ["an old fisherman in a yellow coat", "two dogs running", "a lighthouse", "my grandmother", "a woman in a red dress"]) {
      expect(needsLayout(s), s).toBe(false);
    }
  });

  it("sends instructions, relations and several subjects to the layout", () => {
    for (const s of [
      "add {text} on top of a cloud with land as background and small cows and sheeps on the ground",
      "a cat on a table",
      "a woman and her dog",
      "put the moon behind the castle",
      "move the dog to the left",
      "make the tree bigger",
      "mountains in the background",
      "a house next to a river, with trees",
      'the word "SALE" above the shop',
      "a knight beside a horse",
    ]) {
      expect(needsLayout(s), s).toBe(true);
    }
  });

  it("ignores blank input", () => {
    expect(needsLayout("   ")).toBe(false);
  });
});

describe("fillText", () => {
  it("swaps {text} for the lettering, quoted", () => {
    expect(fillText("add {text} on a cloud", "SALE")).toEqual({ request: 'add "SALE" on a cloud', used: true });
    expect(fillText("add { Text } here", "Hi")).toEqual({ request: 'add "Hi" here', used: true });
  });

  it("leaves text without the placeholder alone", () => {
    expect(fillText('add "SALE" on a cloud', "OTHER")).toEqual({ request: 'add "SALE" on a cloud', used: false });
  });

  it("reports a placeholder with nothing to fill it", () => {
    expect(fillText("add {text} on a cloud", "  ")).toEqual({ request: "add {text} on a cloud", used: false, missing: true });
  });
});
