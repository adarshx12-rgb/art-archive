import { describe, expect, it } from "vitest";
import { decodeLayers, describeLayer, encodeLayers, layerFromText, newLayer, type Layer } from "./layers";

const layer = (patch: Partial<Layer> = {}): Layer => ({ ...newLayer("person", "woman", []), ...patch });

describe("layers", () => {
  it("round-trips through a share link, including names with spaces", () => {
    const ls = [layer({ label: "old fisherman", x: 0.25, y: 0.7, scale: 1.5, rotation: 370, flip: true, from: "man" }), layer({ glyph: "tree", label: "tree", x: 0.8, y: 0.4 })];
    const { layers, bad } = decodeLayers(encodeLayers(ls));
    expect(bad).toBe(false);
    expect(layers.map(({ id: _, ...rest }) => rest)).toEqual(ls.map(({ id: _, ...rest }) => rest));
  });

  it("drops malformed entries and clamps values", () => {
    const { layers, bad } = decodeLayers("person~a~0.5~0.5~99~0~0|nope~x~1~1~1~0~0|car~c~NaN~0~1~0~0");
    expect(bad).toBe(true);
    expect(layers).toHaveLength(1);
    expect(layers[0]!.scale).toBe(8);
  });

  it("makes a layer from typed text, keeping the wording", () => {
    const dogs = layerFromText("two scruffy dogs", [])!;
    expect([dogs.glyph, dogs.label, dogs.count]).toEqual(["animal", "two scruffy dogs", 2]);
    const fisher = layerFromText("an old fisherman in a yellow coat by a boat", [])!;
    expect(fisher.glyph).toBe("person");
    expect(layerFromText("a vintage radio", [])!.glyph).toBe("device");
    expect(layerFromText("a mysterious glowing orb", [])!.glyph).toBe("thing");
    expect(layerFromText("   ", [])).toBeNull();
  });

  it("describes placement in plain words", () => {
    expect(describeLayer(layer({ x: 0.2, y: 0.8 }))).toBe("a woman, in the lower left");
    expect(describeLayer(layer({ x: 0.5, y: 0.5, scale: 2 }))).toBe("a woman, in the centre, filling much of the frame, close to camera");
    expect(describeLayer(layer({ glyph: "animal", label: "old dog", x: 0.8, y: 0.5, rotation: 90 }))).toBe("an old dog, on the right, on its side");
    expect(describeLayer(layer({ label: "two dancers", x: 0.5, y: 0.2, scale: 0.1 }))).toBe("two dancers, in the upper centre, small and far away");
  });
});
