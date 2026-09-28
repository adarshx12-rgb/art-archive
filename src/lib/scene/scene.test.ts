import { describe, expect, it } from "vitest";
import { defaultState, decodeState } from "../prompt/state";
import { effectiveAngle, horizonAt, projectActor, projectScene, shotCamera, unproject } from "./camera";
import { applyLayerEdit } from "./convert";
import { describeScene } from "./describe";
import { actorFromText, decodeActors, encodeActors, newActor, type Actor } from "./model";

const cam = (patch = {}) => shotCamera({ ...defaultState(), ...patch });
const person = (patch: Partial<Actor> = {}): Actor => ({ ...newActor("person", "woman", []), ...patch });

describe("shot camera", () => {
  it("frames a person at the origin in the centre, about 3/4 of the frame tall, in a full shot", () => {
    const p = projectActor(cam(), person());
    expect(p.x).toBeCloseTo(0.5, 2);
    expect(p.size).toBeGreaterThan(0.65);
    expect(p.size).toBeLessThan(0.85);
    expect(p.facing).toBe("front");
  });

  it("puts the subject on the left third line for rule-of-thirds framing", () => {
    expect(projectActor(cam({ composition: "thirds" }), person()).x).toBeCloseTo(1 / 3, 1);
  });

  it("makes subjects bigger in close-ups and smaller in wide shots", () => {
    const full = projectActor(cam(), person()).size;
    expect(projectActor(cam({ shot: "close-up" }), person()).size).toBeGreaterThan(full * 3);
    expect(projectActor(cam({ shot: "wide" }), person()).size).toBeLessThan(full / 2);
  });

  it("reads which way a subject faces", () => {
    expect(projectActor(cam(), person({ rotation: [0, 180, 0] })).facing).toBe("back");
    expect(projectActor(cam(), person({ rotation: [0, 90, 0] })).facing).toBe("right");
    expect(projectActor(cam(), person({ rotation: [0, -90, 0] })).facing).toBe("left");
  });

  it("unprojects a frame position back onto the ground", () => {
    const c = cam();
    const p = unproject(c, 0.5, 0.9, 0, 5);
    expect(p[1]).toBeCloseTo(0, 5);
    const back = projectActor(c, person({ position: p }));
    expect(back.x).toBeCloseTo(0.5, 2);
  });

  it("draws further subjects first", () => {
    const near = person({ id: "near", position: [0, 0, 1] });
    const far = person({ id: "far", position: [0, 0, -10] });
    expect(projectScene(cam(), [near, far]).map((p) => p.id)).toEqual(["far", "near"]);
  });
});

describe("looking around the 3D view", () => {
  const view = (orbit: Partial<ReturnType<typeof defaultState>["orbit"]>, patch = {}) =>
    shotCamera({ ...defaultState(), ...patch, orbit: { yaw: 0, tilt: 0, panX: 0, panY: 0, ...orbit } });

  it("turning around the set shows a subject that faces forward in profile", () => {
    expect(projectActor(view({ yaw: 90 }), person()).facing).toBe("left");
    expect(projectActor(view({ yaw: 180 }), person()).facing).toBe("back");
  });

  it("tilting moves the horizon and changes the angle the prompt describes", () => {
    const level = horizonAt(view({}))!;
    expect(horizonAt(view({ tilt: 30 }))!).toBeLessThan(level);
    expect(effectiveAngle({ ...defaultState(), orbit: { yaw: 0, tilt: 40, panX: 0, panY: 0 } })).toBe("high");
    expect(effectiveAngle({ ...defaultState(), orbit: { yaw: 0, tilt: -20, panX: 0, panY: 0 } })).toBe("low");
    expect(effectiveAngle(defaultState())).toBe("auto");
  });

  it("panning slides subjects across the frame", () => {
    expect(projectActor(view({ panX: 0.5 }), person()).x).toBeLessThan(0.45);
  });
});

describe("the 2D board", () => {
  const flat = shotCamera({ ...defaultState(), view: "2d", orbit: { yaw: 90, tilt: 40, panX: 3, panY: 0 } });

  it("ignores the orbit and doesn't shrink things with distance", () => {
    expect(projectActor(flat, person()).x).toBeCloseTo(0.5, 5);
    expect(projectActor(flat, person({ position: [0, 0, -20] })).size).toBeCloseTo(projectActor(flat, person()).size, 5);
    expect(horizonAt(flat)).toBeNull();
  });

  it("moves subjects within the picture only, never in depth", () => {
    const a = person({ position: [0, 0, -3] });
    const moved = applyLayerEdit(flat, a, { x: 0.3, y: 0.3 });
    expect(moved.position[2]).toBe(-3);
    const p = projectActor(flat, moved);
    expect(p.x).toBeCloseTo(0.3, 3);
    expect(p.y).toBeCloseTo(0.3, 3);
  });
});

describe("editing on the flat sketch", () => {
  it("drags a subject across the ground to where it was dropped", () => {
    const c = cam();
    const moved = applyLayerEdit(c, person(), { x: 0.25 });
    expect(moved.position[1]).toBe(0);
    expect(projectActor(c, moved).x).toBeCloseTo(0.25, 2);
  });

  it("scales and rolls the 3D subject", () => {
    const c = cam();
    const a = person();
    const now = projectActor(c, a);
    expect(applyLayerEdit(c, a, { scale: now.scale * 2 }).scale).toBeCloseTo(2, 5);
    expect(applyLayerEdit(c, a, { rotation: 30 }).rotation[2]).toBe(30);
  });
});

describe("scene description", () => {
  it("names position, depth, facing, pose and what is hidden", () => {
    const c = cam({ shot: "wide" });
    const front = person({ id: "a", label: "knight", position: [0, 0, 2] });
    const behind = person({ id: "b", label: "squire", position: [0.1, 0, -3], rotation: [0, 180, 0], pose: "sit" });
    const text = describeScene(projectScene(c, [front, behind]), 0.8);
    expect(text).toMatch(/^a knight, .*in the foreground.*facing the camera \(the main subject\)/);
    expect(text).toMatch(/a squire, .*in the background.*sitting, seen from behind, partly hidden behind the knight/);
  });
});

describe("scene links", () => {
  it("round-trips the scene through a share link", () => {
    const actors = [person({ label: "old fisherman", position: [1.25, 0, -2.5], rotation: [5, 170, -3], scale: 1.2, pose: "walk", count: 2 })];
    const { actors: back, bad } = decodeActors(encodeActors(actors));
    expect(bad).toBe(false);
    expect(back.map(({ id: _, ...r }) => r)).toEqual(actors.map(({ id: _, ...r }) => r));
  });

  it("converts old 2D layer links into the 3D scene", () => {
    const { state, issues } = decodeState(new URLSearchParams("s=swiss&ly=person~knight~0.25~0.6~1~0~0~~1"));
    expect(issues).toEqual([]);
    expect(state.actors).toHaveLength(1);
    expect(projectActor(shotCamera(state), state.actors[0]!).x).toBeCloseTo(0.25, 1);
  });

  it("builds subjects from typed text with pose and count", () => {
    const a = actorFromText("two dancers dancing on the sand", [])!;
    expect([a.glyph, a.count, a.pose]).toEqual(["person", 2, "dance"]);
    expect(actorFromText("a red car", [])!.rotation[1]).toBe(90);
  });
});
