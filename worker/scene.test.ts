import { describe, expect, it } from "vitest";
import { frameTable, sceneActors } from "./scene";

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

describe("frameTable", () => {
  // The builder's default: eye height 0.95 m looking level from z 3.35, 37.85° tall, 4:5.
  const frame = { halfWidth: 0.92, height: 2.1, cameraZ: 3.354, eyeY: 0.95, lookY: 0.95, slope: Math.tan((37.85 * Math.PI) / 360), aspect: 0.8 };

  it("says what the frame covers further back, where the model can't guess", () => {
    const at40 = frameTable(frame)!.find((r) => r.z === -50)!;
    // 53.35 m from the camera: ±0.343·53.35 ≈ 18.3 m about eye height.
    expect(at40.top).toBeCloseTo(19.2, 0);
    expect(at40.bottom).toBeCloseTo(-17.3, 0);
    expect(at40.halfWidth).toBeCloseTo(14.6, 0);
  });

  it("matches the frame at z = 0", () => {
    const at0 = frameTable(frame)!.find((r) => r.z === 0)!;
    expect(at0.top).toBeCloseTo(2.1, 1);
    expect(at0.halfWidth).toBeCloseTo(0.92, 1);
  });

  it("is left out for older pages that don't send the camera", () => {
    expect(frameTable({ halfWidth: 1, height: 2, cameraZ: 3 })).toBeUndefined();
  });
});
