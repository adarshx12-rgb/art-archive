import { describe, expect, it } from "vitest";
import { sceneActors } from "./scene";

type Subject = Parameters<typeof sceneActors>[0][number];
const subject = (patch: Partial<Subject> = {}): Subject => ({ id: "", kind: "cloud", label: "cloud", count: 1, x: 0, y: 20, z: -60, turn: 0, lean: 0, roll: 0, scale: 1, pose: "stand", ...patch });

describe("sceneActors", () => {
  it("keeps lettering the user quoted, exactly as written", () => {
    const out = sceneActors([subject({ kind: "text", label: "SALE", scale: 12 })], { mode: "new", text: 'add "SALE" on top of a cloud', scene: [] });
    expect(out).toHaveLength(1);
    expect(out[0]!.label).toBe("SALE");
    expect(out[0]!.scale).toBe(12);
  });

  it("drops lettering the user never asked for", () => {
    const out = sceneActors([subject(), subject({ kind: "text", label: "Welcome to the farm" })], { mode: "new", text: "a cloud over a farm", scene: [] });
    expect(out.map((a) => a.glyph)).toEqual(["cloud"]);
  });

  it("keeps existing text subjects on an edit", () => {
    const existing = [{ id: "t1", glyph: "text" as const, label: "OPEN", position: [0, 2, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: 1, pose: "stand" as const, count: 1 }];
    const out = sceneActors([subject({ id: "t1", kind: "text", label: "OPEN" })], { mode: "edit", text: "move it left", scene: existing });
    expect(out.map((a) => a.id)).toEqual(["t1"]);
  });

  it("caps the scale", () => {
    expect(sceneActors([subject({ scale: 90 })], { mode: "new", text: "a cloud", scene: [] })[0]!.scale).toBe(20);
  });
});
