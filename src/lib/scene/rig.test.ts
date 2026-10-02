import { describe, expect, it } from "vitest";
import { decodeRig, describeRig, dragJoint, encodeRig, mirrorRig, rigFor, shoulderOf, solveLimb, type Pt, type Rig } from "./rig";

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a: Pt, b: Pt, d = 1e-6) => expect(dist(a, b)).toBeLessThan(d);

describe("solveLimb", () => {
  it("bends the middle joint so both bones keep their length", () => {
    const { mid, end } = solveLimb({ x: 0, y: 0 }, { x: 0.2, y: 0.1 }, 0.17, 0.17, 1);
    expect(dist({ x: 0, y: 0 }, mid)).toBeCloseTo(0.17, 6);
    expect(dist(mid, end)).toBeCloseTo(0.17, 6);
    near(end, { x: 0.2, y: 0.1 });
  });

  it("bends to the side asked for", () => {
    const a = solveLimb({ x: 0, y: 0 }, { x: 0.3, y: 0 }, 0.17, 0.17, 1).mid;
    const b = solveLimb({ x: 0, y: 0 }, { x: 0.3, y: 0 }, 0.17, 0.17, -1).mid;
    expect(Math.sign(a.y)).toBe(-Math.sign(b.y));
  });

  it("straightens towards a target out of reach instead of stretching", () => {
    const { mid, end } = solveLimb({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.17, 0.17, 1);
    expect(end.x).toBeCloseTo(0.34, 4);
    expect(end.y).toBeCloseTo(0, 4);
    expect(mid.x).toBeCloseTo(0.17, 4);
  });
});

describe("dragJoint", () => {
  const stand = rigFor("stand");
  const len = (r: Rig) => ({
    upperL: dist(shoulderOf(r), r.elbowL),
    lowerL: dist(r.elbowL, r.handL),
    thighR: dist(r.hip, r.kneeR),
    shinR: dist(r.kneeR, r.footR),
  });

  it("moving a hand bends the elbow and keeps the arm's bones", () => {
    const moved = dragJoint(stand, "handL", { x: -0.2, y: 0.9 });
    near(moved.handL, { x: -0.2, y: 0.9 });
    expect(len(moved).upperL).toBeCloseTo(len(stand).upperL, 6);
    expect(len(moved).lowerL).toBeCloseTo(len(stand).lowerL, 6);
  });

  it("lowering the hips keeps the feet planted and the legs whole", () => {
    const crouched = dragJoint(stand, "hip", { x: 0, y: 0.3 });
    near(crouched.footR, stand.footR);
    near(crouched.footL, stand.footL);
    expect(len(crouched).thighR).toBeCloseTo(len(stand).thighR, 6);
    expect(len(crouched).shinR).toBeCloseTo(len(stand).shinR, 6);
    // The upper body comes down with the hips.
    expect(crouched.neck.y).toBeCloseTo(stand.neck.y - (stand.hip.y - crouched.hip.y), 6);
  });

  it("hips can't be pulled away from the feet", () => {
    const pulled = dragJoint(stand, "hip", { x: 0, y: 3 });
    expect(pulled.hip.y).toBeLessThanOrEqual(stand.hip.y + 0.05);
  });

  it("the head tilts the upper body around the hips", () => {
    const bowed = dragJoint(stand, "head", { x: 0.4, y: 0.6 });
    expect(dist(bowed.hip, bowed.neck)).toBeCloseTo(dist(stand.hip, stand.neck), 6);
    expect(bowed.neck.x).toBeGreaterThan(0.2);
    near(bowed.footL, stand.footL);
  });

  it("keeps feet above the ground", () => {
    expect(dragJoint(stand, "footR", { x: 0.1, y: -0.5 }).footR.y).toBeGreaterThanOrEqual(0);
  });
});

describe("share links", () => {
  it("round-trips a rig to two decimals", () => {
    const r = dragJoint(rigFor("stand"), "handR", { x: 0.25, y: 0.95 });
    const back = decodeRig(encodeRig(r))!;
    expect(back).not.toBeNull();
    expect(dist(back.handR, r.handR)).toBeLessThan(0.01);
  });

  it("rejects junk", () => {
    expect(decodeRig("1,2,3")).toBeNull();
    expect(decodeRig("a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v")).toBeNull();
  });
});

describe("describeRig", () => {
  const stand = rigFor("stand");

  it("says nothing about a plain standing pose", () => {
    expect(describeRig(stand)).toBe("");
  });

  it("names raised and outstretched arms by the side of the frame they're on", () => {
    const up = dragJoint(stand, "handL", { x: -0.12, y: 1.1 });
    expect(describeRig(up)).toBe("the arm on the left raised overhead");
    const both = dragJoint(up, "handR", { x: 0.12, y: 1.1 });
    expect(describeRig(both)).toBe("both arms raised overhead");
    const out = dragJoint(stand, "handR", { x: 0.36, y: 0.8 });
    expect(describeRig(out)).toBe("the arm on the right stretched out to the side");
  });

  it("describes crouching, kneeling, a lifted leg, a wide stance and leaning", () => {
    expect(describeRig(dragJoint(stand, "hip", { x: 0, y: 0.3 }))).toContain("crouching");
    expect(describeRig(dragJoint(dragJoint(stand, "hip", { x: 0, y: 0.3 }), "kneeL", { x: -0.1, y: 0.02 }))).toContain("kneeling on the left knee");
    expect(describeRig(dragJoint(stand, "footR", { x: 0.15, y: 0.25 }))).toContain("the leg on the right lifted");
    const wide = dragJoint(dragJoint(stand, "footL", { x: -0.3, y: 0 }), "footR", { x: 0.3, y: 0 });
    expect(describeRig(wide)).toContain("in a wide stance");
    expect(describeRig(dragJoint(stand, "head", { x: 0.25, y: 0.9 }))).toContain("leaning to the right");
  });

  it("reads the same before and after a share link, even on a borderline pose", () => {
    let r = dragJoint(rigFor("stand"), "hip", { x: 0, y: 0.3 });
    r = { ...r, handR: { x: 0.32, y: 0.5049 }, elbowR: { x: 0.16, y: 0.57 } };
    expect(describeRig(decodeRig(encodeRig(r))!)).toBe(describeRig(r));
  });

  it("reads a mirrored figure the other way round", () => {
    const up = dragJoint(stand, "handL", { x: -0.12, y: 1.1 });
    expect(describeRig(mirrorRig(up))).toBe("the arm on the right raised overhead");
  });
});
