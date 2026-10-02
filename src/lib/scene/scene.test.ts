import { describe, expect, it } from "vitest";
import { defaultState, decodeState } from "../prompt/state";
import { effectiveAngle, horizonAt, projectActor, projectScene, shotCamera, unproject } from "./camera";
import { applyLayerEdit, placeInFrame } from "./convert";
import { describeScene, subjectAt } from "./describe";
import { actorFromText, decodeActors, encodeActors, imageActor, newActor, textActor, widthRatio, type Actor, type Vec3 } from "./model";

const cam = (patch = {}) => shotCamera({ ...defaultState(), view: "3d", ...patch });
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
    shotCamera({ ...defaultState(), view: "3d", ...patch, orbit: { yaw: 0, tilt: 0, panX: 0, panY: 0, ...orbit } });

  it("turning around the set shows a subject that faces forward in profile", () => {
    expect(projectActor(view({ yaw: 90 }), person()).facing).toBe("left");
    expect(projectActor(view({ yaw: 180 }), person()).facing).toBe("back");
  });

  it("tilting moves the horizon and changes the angle the prompt describes", () => {
    const level = horizonAt(view({}))!;
    expect(horizonAt(view({ tilt: 30 }))!).toBeLessThan(level);
    expect(effectiveAngle({ ...defaultState(), view: "3d", orbit: { yaw: 0, tilt: 40, panX: 0, panY: 0 } })).toBe("high");
    expect(effectiveAngle({ ...defaultState(), view: "3d", orbit: { yaw: 0, tilt: -20, panX: 0, panY: 0 } })).toBe("low");
    expect(effectiveAngle(defaultState())).toBe("auto");
  });

  it("panning slides subjects across the frame", () => {
    expect(projectActor(view({ panX: 0.5 }), person()).x).toBeLessThan(0.45);
  });
});

describe("the 2D board", () => {
  const flat = shotCamera({ ...defaultState(), view: "2d", orbit: { yaw: 90, tilt: 40, panX: 3, panY: 0 } });

  it("ignores the orbit and keeps the 3D view's composition", () => {
    expect(projectActor(flat, person()).x).toBeCloseTo(0.5, 5);
    const straight = shotCamera(defaultState());
    expect(projectActor(flat, person()).size).toBeCloseTo(projectActor(straight, person()).size, 5);
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

describe("adding typed subjects", () => {
  it("recognises people, animals, vehicles, places, nature, sky and objects", () => {
    const cases: [string, string][] = [
      ["an old fisherman", "person"], ["a child", "child"], ["a robot", "robot"],
      ["a sleeping dog", "animal"], ["a horse", "big-animal"], ["a bird", "bird"], ["a fish", "fish"],
      ["a red car", "car"], ["a bicycle", "bike"], ["a boat", "boat"], ["a train", "train"], ["a plane", "plane"],
      ["a house", "house"], ["a tower", "tower"], ["a lighthouse", "lighthouse"], ["a castle", "castle"], ["a city", "city"], ["a door", "door"], ["a window", "window"],
      ["a tree", "tree"], ["a palm tree", "palm"], ["a flower", "flower"], ["a mountain", "mountain"], ["a hill", "hill"],
      ["the sun", "sun"], ["the moon", "moon"], ["a planet", "planet"], ["a cloud", "cloud"], ["a star", "star"],
      ["a wooden table", "table"], ["a chair", "chair"], ["a bed", "bed"], ["a lamp", "lamp"], ["a book", "book"], ["a cup", "cup"],
      ["a candle", "candle"], ["a sword", "sword"], ["a guitar", "guitar"], ["a phone", "thing"], ["a bottle", "bottle"],
    ];
    for (const [text, glyph] of cases) expect(actorFromText(text, [])?.glyph, text).toBe(glyph);
  });
});

describe("text placed on the sketch", () => {
  it("makes a text item that keeps its words and survives a share link", () => {
    const t = textActor("  Hola   amigo ", []);
    expect(t?.glyph).toBe("text");
    expect(t?.label).toBe("Hola amigo");
    expect(textActor("   ", [])).toBeNull();
    const { actors, bad } = decodeActors(encodeActors([t!]));
    expect(bad).toBe(false);
    expect(actors[0]).toMatchObject({ glyph: "text", label: "Hola amigo" });
  });

  it("is never the main subject and is named as text in the layout", () => {
    const table = actorFromText("a table", [])!;
    const text = { ...textActor("OPEN LATE", [table])!, position: [0, 1, 1.5] as Vec3 };
    const projected = projectScene(cam(), [table, text]);
    const layout = describeScene(projected, 4 / 5);
    expect(layout).toMatch(/^a table.*\(the main subject\)/);
    expect(layout).toContain('the text "OPEN LATE"');
  });

  it("fits in the frame when placed, short or long, in 3D and on the 2D board", () => {
    for (const view of ["3d", "2d"] as const) {
      const c = cam({ view });
      for (const words of ["HI", "hola amigo", "a much longer line of text for a poster headline"]) {
        const p = projectActor(c, placeInFrame(c, textActor(words, [])!, 0));
        const wide = (p.size * Math.max(1, 0.62 * words.length)) / c.aspect;
        expect(wide, `${view} ${words}`).toBeLessThanOrEqual(0.61);
        expect(p.size, `${view} ${words}`).toBeLessThanOrEqual(0.101);
        expect(p.x).toBeCloseTo(0.5, 1);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(0.4);
      }
    }
  });
});

describe("actorFromText", () => {
  const glyph = (text: string) => actorFromText(text, [])!.glyph;

  it("uses a built-in shape only when it's what the subject is", () => {
    expect(glyph("a glass of wine")).toBe("cup");
    expect(glyph("old wooden chair by the window")).toBe("chair");
    expect(glyph("a lighthouse keeper reading")).toBe("person");
    expect(glyph("a red sports car")).toBe("car");
    expect(glyph("castles on a hill")).toBe("castle");
  });

  it("leaves subjects named after a material or detail to an AI drawing", () => {
    expect(glyph("sharp cantilevered glass and steel truss")).toBe("thing");
    expect(glyph("a tower crane")).toBe("thing");
  });

  it("draws devices as AI icons, not one shared rectangle", () => {
    expect(glyph("a laptop")).toBe("thing");
    expect(glyph("an old radio")).toBe("thing");
  });
});

describe("subjectAt", () => {
  const c = cam({ aspect: "1:1" });
  const near = { ...newActor("person", "sailor", []), id: "near", position: [0, 0, 2] as Vec3 };
  const far = { ...newActor("boat", "boat", []), id: "far", position: [0, 0, -4] as Vec3 };
  const projected = projectScene(c, [far, near]);
  const onNear = projected.find((p) => p.actor.id === "near")!;

  it("picks the nearest subject under the point, the one drawn on top", () => {
    expect(subjectAt(onNear.x, onNear.y, projected, 1)?.actor.id).toBe("near");
  });

  it("at the same distance, picks the one added last, which is drawn on top", () => {
    const a = { ...newActor("boat", "boat", []), id: "a", position: [0, 0, 0] as Vec3 };
    const b = { ...newActor("boat", "raft", []), id: "b", position: [0, 0, 0] as Vec3 };
    const both = projectScene(c, [a, b]);
    expect(subjectAt(0.5, both[0]!.y, both, 1)?.actor.id).toBe(both[both.length - 1]!.actor.id);
  });

  it("finds nothing on empty space", () => {
    expect(subjectAt(0.02, 0.02, projected, 1)).toBeUndefined();
  });
});

describe("images on the sketch", () => {
  it("keeps the picture's key and shape through a share link", () => {
    const img = imageActor({ key: "k123", ratio: 1.5 }, []);
    expect(img.glyph).toBe("image");
    expect(img.label).toBe("image 1");
    const { actors, bad } = decodeActors(encodeActors([img]));
    expect(bad).toBe(false);
    expect(actors[0]).toMatchObject({ glyph: "image", label: "image 1", image: { key: "k123", ratio: 1.5 } });
  });

  it("numbers images in order and is as wide as its crop", () => {
    const a = imageActor({ key: "a", ratio: 2 }, []);
    const b = imageActor({ key: "b", ratio: 0.5 }, [a]);
    expect(b.label).toBe("image 2");
    expect(widthRatio("image", "image 1", 2)).toBe(2);
  });

  it("rejects a bad shape in a link", () => {
    const raw = encodeActors([imageActor({ key: "k", ratio: 1 }, [])]).replace(/~1$/, "~-4");
    expect(decodeActors(raw).actors[0]!.image!.ratio).toBeGreaterThan(0);
  });
});
