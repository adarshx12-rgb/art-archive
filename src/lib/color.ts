import type { Hex } from "../content/types";

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns an upper-case #RRGGBB string, or null when the input is not a hex colour. */
export function normaliseHex(input: string): Hex | null {
  const m = HEX_RE.exec(input.trim());
  if (!m || !m[1]) return null;
  let body = m[1];
  if (body.length === 3) body = body.split("").map((ch) => ch + ch).join("");
  return `#${body.toUpperCase()}` as Hex;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = normaliseHex(hex) ?? "#000000";
  const v = parseInt(n.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((x) => {
    const c = x / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Near-black or off-white — whichever reads better on the given colour. */
export function inkOn(hex: string): "#191919" | "#F4F2ED" {
  return contrastRatio(hex, "#191919") >= contrastRatio(hex, "#F4F2ED") ? "#191919" : "#F4F2ED";
}

const HUES: [number, string][] = [
  [12, "red"],
  [28, "orange"],
  [45, "amber"],
  [65, "yellow"],
  [85, "yellow-green"],
  [150, "green"],
  [175, "teal"],
  [200, "cyan"],
  [225, "sky blue"],
  [255, "blue"],
  [275, "indigo"],
  [300, "violet"],
  [330, "magenta"],
  [345, "pink"],
  [360, "red"],
];

/**
 * A plain-language description of any hex colour, e.g. "deep muted teal".
 * Used for custom colours in prompts so they are described, not just coded.
 */
export function describeHex(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (s < 0.1 || l < 0.04 || l > 0.97 || (l > 0.9 && s < 0.5) || (l < 0.12 && s < 0.5)) {
    const tint = s >= 0.03 && l > 0.08 && l < 0.95 ? (h < 90 || h > 300 ? "warm " : "cool ") : "";
    if (l > 0.93) return `${tint}off-white`;
    if (l > 0.78) return `${tint}light grey`;
    if (l > 0.5) return `${tint}mid grey`;
    if (l > 0.2) return `${tint}dark grey`;
    return l > 0.08 ? `${tint}near-black` : "black";
  }
  const hue = HUES.find(([limit]) => h < limit)?.[1] ?? "red";
  const parts: string[] = [];
  if (l > 0.86) parts.push("pale");
  else if (l > 0.7) parts.push("light");
  else if (l < 0.2) parts.push("very dark");
  else if (l < 0.36) parts.push("deep");
  if (s < 0.3) parts.push("muted");
  else if (s > 0.8 && l > 0.4 && l < 0.7) parts.push("vivid");
  // Some hue families have better everyday names at particular lightnesses.
  let name = hue;
  if (hue === "orange" && l < 0.4) name = "brown";
  if (hue === "amber" && l < 0.4) name = "olive brown";
  if (hue === "yellow" && l < 0.35) name = "olive";
  if (hue === "blue" && l < 0.3) name = "navy";
  if (hue === "red" && l < 0.3) name = "oxblood";
  if (hue === "pink" && l < 0.35) name = "plum";
  if (hue === "amber" && l > 0.55 && s < 0.6) name = "sand";
  return [...parts, name].join(" ");
}

/** Perceptual-ish distance (weighted RGB). Adequate for ranking palette matches. */
export function colourDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}
