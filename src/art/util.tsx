import type { ReactElement } from "react";

/** Canvas size for every style study. 4:5 portrait. */
export const W = 400;
export const H = 500;

/** Four colours: [ground, first, second, third]. */
export type Colours = readonly [string, string, string, string];

/**
 * A study renderer draws SVG children for a 400×500 canvas.
 * `u` is a unique prefix for gradient / filter / pattern ids.
 */
export type Renderer = (k: Colours, u: string) => ReactElement;

/** Deterministic PRNG so studies render identically every time. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Gear outline centred at (cx, cy). */
export function gearPath(cx: number, cy: number, r: number, teeth: number, depth = 0.16): string {
  const pts: string[] = [];
  const steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const outer = i % 4 === 1 || i % 4 === 2;
    const rr = outer ? r : r * (1 - depth);
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** A star / sparkle with `n` points. */
export function starPath(cx: number, cy: number, outer: number, inner: number, n = 5, rot = -Math.PI / 2): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / n;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Irregular "torn" polygon around a rectangle. */
export function tornRect(x: number, y: number, w: number, h: number, seed: number, jag = 5): string {
  const r = rng(seed);
  const pts: [number, number][] = [];
  const step = 10;
  for (let i = 0; i <= w; i += step) pts.push([x + i, y + (r() - 0.5) * jag]);
  for (let i = 0; i <= h; i += step) pts.push([x + w + (r() - 0.5) * jag, y + i]);
  for (let i = w; i >= 0; i -= step) pts.push([x + i, y + h + (r() - 0.5) * jag]);
  for (let i = h; i >= 0; i -= step) pts.push([x + (r() - 0.5) * jag, y + i]);
  return `M${pts.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join("L")}Z`;
}

/** Smooth wavy ring used by psychedelic / aurora studies. */
export function wavyRing(cx: number, cy: number, r: number, amp: number, waves: number, phase = 0): string {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const rr = r + Math.sin(a * waves + phase) * amp;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** Film-grain / paper noise overlay. */
export function Grain({ u, opacity = 0.18, freq = 0.9 }: { u: string; opacity?: number; freq?: number }) {
  return (
    <>
      <filter id={`${u}grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter={`url(#${u}grain)`} opacity={opacity} style={{ mixBlendMode: "multiply" }} />
    </>
  );
}
