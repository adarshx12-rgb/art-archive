import { describe, expect, it } from "vitest";
import { cleanDrawing, cleanPath, drawingKey, DRAW_H, DRAW_W, MAX_STROKES } from "./drawing";

describe("cleanPath", () => {
  it("keeps absolute move, line, curve and close commands", () => {
    expect(cleanPath("M10 90 L60 10 Q80 0 110 90 C 100 95, 20 95, 10 90 Z")).toBe("M10 90L60 10Q80 0 110 90C100 95 20 95 10 90Z");
  });

  it("clamps coordinates into the drawing box", () => {
    expect(cleanPath("M-50 50 L500 -20")).toBe(`M0 50L${DRAW_W} 0`);
  });

  it("rounds long decimals", () => {
    expect(cleanPath("M10.123456 20.987654 L30 40")).toBe("M10.1 21L30 40");
  });

  it("rejects relative commands, arcs and anything else", () => {
    expect(cleanPath("m10 10 l5 5")).toBeNull();
    expect(cleanPath("M10 10 A5 5 0 0 1 20 20")).toBeNull();
    expect(cleanPath("M10 10 L20 20 <script>")).toBeNull();
    expect(cleanPath("url(javascript:alert(1))")).toBeNull();
  });

  it("rejects paths with the wrong number of values or no start", () => {
    expect(cleanPath("M10 10 L20")).toBeNull();
    expect(cleanPath("L20 20")).toBeNull();
    expect(cleanPath("")).toBeNull();
  });
});

describe("cleanDrawing", () => {
  it("drops bad strokes and keeps good ones, as outlines only", () => {
    const out = cleanDrawing([{ d: "M0 0 L10 10" }, { d: "nonsense" }, { d: "M20 20 L30 30 L20 30 Z", fill: "main" } as { d: string }]);
    expect(out).toEqual([{ d: "M0 0L10 10" }, { d: "M20 20L30 30L20 30Z" }]);
  });

  it(`keeps at most ${MAX_STROKES} strokes`, () => {
    const many = Array.from({ length: 60 }, () => ({ d: "M0 0 L10 10" }));
    expect(cleanDrawing(many)).toHaveLength(MAX_STROKES);
  });

  it("has room for icon details like a row of keys", () => {
    expect(MAX_STROKES).toBeGreaterThanOrEqual(30);
  });

  it("returns null when nothing usable is left", () => {
    expect(cleanDrawing([{ d: "oops" }])).toBeNull();
  });

  it("box is wider than tall, like the placeholder", () => {
    expect(DRAW_W / DRAW_H).toBeCloseTo(1.2);
  });
});

describe("drawingKey", () => {
  it("ignores case and extra spaces", () => {
    expect(drawingKey("  Glass   Truss ")).toBe(drawingKey("glass truss"));
  });
});
