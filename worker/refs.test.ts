import { describe, expect, it } from "vitest";
import type { Env } from "./env";
import { referenceImages } from "./refs";

/** A stand-in for the private KV namespace: key → file contents, read as bytes. */
const bucket = (objects: Record<string, string>) =>
  ({ get: async (key: string, type: string) => (type === "arrayBuffer" && key in objects ? new TextEncoder().encode(objects[key]).buffer : null) }) as unknown as KVNamespace;

describe("referenceImages", () => {
  it("returns data URLs in order, skipping missing objects, at most five", async () => {
    const env = { REFS: bucket({ "a.jpg": "A", "c.jpg": "C", "d.jpg": "D", "e.jpg": "E", "f.jpg": "F", "g.jpg": "G" }) } as unknown as Env;
    expect(await referenceImages(env, ["a", "b", "c", "d", "e", "f", "g"])).toEqual(["A", "C", "D", "E", "F"].map((c) => `data:image/jpeg;base64,${btoa(c)}`));
  });

  it("returns nothing without a binding or when the bucket fails", async () => {
    expect(await referenceImages({} as Env, ["a"])).toEqual([]);
    const broken = { REFS: { get: async () => { throw new Error("down"); } } } as unknown as Env;
    expect(await referenceImages(broken, ["a"])).toEqual([]);
  });
});
