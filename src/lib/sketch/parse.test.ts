import { describe, expect, it } from "vitest";
import { parseSubject } from "./parse";

const summary = (text: string) => parseSubject(text).items.map((i) => `${i.count} ${i.label}`);

describe("parseSubject", () => {
  it("finds people, places and objects with counts", () => {
    expect(summary("a lighthouse keeper reading by a window at dusk")).toEqual(["1 lighthouse", "1 keeper", "1 window", "1 dusk"]);
    expect(summary("two old women and 3 dogs")).toEqual(["2 woman", "3 dog"]);
    expect(summary("people on a beach")).toEqual(["3 person"]);
    expect(summary("a couple under the moon")).toEqual(["2 person", "1 moon"]);
    expect(summary("dancers under palm trees")).toEqual(["3 dancer", "3 palm"]);
    expect(summary("a marble statue")).toEqual(["1 statue"]);
    expect(summary("friends, fishermen and puppies")).toEqual(["3 friend", "3 fisherman", "3 puppy"]);
  });

  it("merges repeated words and caps counts", () => {
    expect(summary("a cat, another cat")).toEqual(["1 cat"]);
    expect(summary("twenty stars")).toEqual(["3 star"]);
    expect(summary("10 stars")).toEqual(["6 star"]);
  });

  it("assigns layers, pose, interior and water", () => {
    const s = parseSubject("two women dancing in a kitchen by the sea under the sun");
    expect(s.pose).toBe("dance");
    expect(s.interior).toBe(true);
    expect(s.water).toBe(true);
    expect(s.items.find((i) => i.label === "sun")?.layer).toBe("sky");
    expect(s.items.find((i) => i.label === "woman")?.layer).toBe("front");
  });

  it("returns an empty scene for unknown or empty text", () => {
    expect(parseSubject("").items).toEqual([]);
    expect(parseSubject("an abstract feeling of nostalgia").items).toEqual([]);
    expect(parseSubject("").pose).toBe("stand");
  });
});
