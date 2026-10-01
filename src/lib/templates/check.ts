import { formatInfo, isTextBlock, type RoleColours } from "../../content/templates";
import type { StyleTemplate, TemplateBlock } from "../../content/types";
import { contrastRatio } from "../color";

/**
 * Checks a template can be drawn and read: everything on the canvas, text in
 * the safe area, no text on text, enough contrast, words that fit their box,
 * and what the format needs. Used by scripts/templates.mjs before a template
 * is kept, and by the tests.
 */

export interface TemplateIssue {
  block?: string;
  message: string;
}

/**
 * Words that make template copy read as filler or praise instead of saying
 * what a design choice does. Notes should be plain and specific, e.g. "The
 * red block keeps the headline readable over the image."
 */
export const FILLER_WORDS =
  /\b(?:quintessential\w*|uncompromising\w*|honou?ring|iconic\w*|seamless\w*|effortless\w*|curated|evok\w*|evocative\w*|authentic\w*|commanding|monumental|masterful\w*|timeless\w*|elevat(?:e|es|ed|ing)|unmistakabl\w*|impeccabl\w*|breathtaking\w*|stunning\w*)\b/gi;

/** The filler words in a piece of copy, lower-cased, in order. */
export function fillerWords(text: string): string[] {
  return [...text.matchAll(FILLER_WORDS)].map((m) => m[0].toLowerCase());
}

/** Average glyph width in em; capitals run wider. */
const GLYPH = 0.52;
const CAPS = 0.66;
const MARGIN = 0.03;
/** Text at least this size (canvas heights) counts as large for contrast. */
const LARGE = 0.035;

/** How many lines the words wrap to in a box `w` wide (fraction of width) on a canvas `ratio` wide. */
export function estimateLines(text: string, size: number, w: number, ratio: number, upper = false, tracking = 0): number {
  const boxWidth = w * ratio;
  const per = size * ((upper ? CAPS : GLYPH) + tracking);
  // Each written line break starts a new line; the words between them wrap.
  return text.split("\n").reduce((total, line) => {
    let lines = 1;
    let used = 0;
    for (const word of line.split(/\s+/).filter(Boolean)) {
      const need = (word.length + (used ? 1 : 0)) * per;
      // A little slack: real type rarely fills a box to the edge.
      if (used && used + need > boxWidth * 1.03) {
        lines++;
        used = word.length * per;
      } else used += need;
    }
    return total + lines;
  }, 0);
}

/** Where a block really lands once rotated (rotation happens in pixels, so the canvas ratio matters). */
export function footprint(b: TemplateBlock, ratio: number) {
  if (!b.rotate) return { x: b.x, y: b.y, w: b.w, h: b.h };
  const a = (b.rotate * Math.PI) / 180;
  const cos = Math.abs(Math.cos(a));
  const sin = Math.abs(Math.sin(a));
  const wide = b.w * ratio; // width in height units
  const w = (wide * cos + b.h * sin) / ratio;
  const h = wide * sin + b.h * cos;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

const overlap = (a: TemplateBlock, b: TemplateBlock) => {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
};

const centre = (b: TemplateBlock) => [b.x + b.w / 2, b.y + b.h / 2] as const;
const contains = (b: TemplateBlock, [x, y]: readonly [number, number]) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

const REQUIRED: Record<StyleTemplate["format"], TemplateBlock["kind"][]> = {
  magazine: ["masthead", "image"],
  poster: ["headline"],
  flyer: ["headline", "cta"],
  thumbnail: ["headline", "image"],
};

export function checkTemplate(t: StyleTemplate, colours: RoleColours): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  const ratio = formatInfo(t.format).ratio;
  const texts = t.blocks.filter(isTextBlock);

  const ids = new Set<string>();
  for (const b of t.blocks) {
    if (ids.has(b.id)) issues.push({ block: b.id, message: `Two blocks share the id "${b.id}".` });
    ids.add(b.id);
    // Images and shapes may bleed off the edge a little; text may not.
    const slack = isTextBlock(b) ? -MARGIN : 0.05;
    if (b.w <= 0 || b.h <= 0) issues.push({ block: b.id, message: `"${b.id}" has no size.` });
    const f = footprint(b, ratio);
    if (f.x < -slack || f.y < -slack || f.x + f.w > 1 + slack || f.y + f.h > 1 + slack)
      issues.push({ block: b.id, message: isTextBlock(b) ? `"${b.id}" is outside the safe area (keep text ${MARGIN * 100}% in from every edge).` : `"${b.id}" runs well off the canvas.` });
  }

  for (const kind of REQUIRED[t.format]) {
    if (!t.blocks.some((b) => b.kind === kind)) issues.push({ message: `A ${formatInfo(t.format).label.toLowerCase()} needs a ${kind} block.` });
  }

  texts.forEach((a, i) =>
    texts.slice(i + 1).forEach((b) => {
      const shared = overlap(a, b);
      if (shared > 0.15 * Math.min(a.w * a.h, b.w * b.h)) issues.push({ block: b.id, message: `"${a.id}" and "${b.id}" overlap.` });
    }),
  );

  for (const b of texts) {
    const size = b.size ?? 0.05;
    // What the text sits on: the topmost shape under its centre, else the page.
    const under = [...t.blocks.slice(0, t.blocks.indexOf(b))].reverse().find((s) => s.kind === "shape" && s.fill && (s.opacity ?? 1) >= 0.6 && contains(s, centre(b)));
    const ground = colours[under?.fill ?? t.background];
    const ink = colours[b.colour ?? "primary"];
    const need = size >= LARGE ? 3 : 4.5;
    const ratioC = contrastRatio(ink, ground);
    if (ratioC < need) issues.push({ block: b.id, message: `"${b.id}" has low contrast (${ratioC.toFixed(1)}:1, needs ${need}:1) against what it sits on.` });

    const lines = estimateLines(b.text!, size, b.w, ratio, b.upper, b.tracking ?? 0);
    const tall = lines * size * (b.leading ?? 1.15);
    if (tall > b.h * 1.25) issues.push({ block: b.id, message: `"${b.id}" won't fit: about ${lines} line(s) need ${tall.toFixed(2)} of the height, the box is ${b.h.toFixed(2)}.` });
  }

  if (t.format === "thumbnail") {
    const words = texts.filter((b) => b.kind === "headline" || b.kind === "masthead").reduce((n, b) => n + b.text!.split(/\s+/).filter(Boolean).length, 0);
    if (words > 5) issues.push({ message: `Thumbnail headline has ${words} words; keep it to five or fewer.` });
    for (const b of texts) if (b.x + b.w > 0.8 && b.y + b.h > 0.82) issues.push({ block: b.id, message: `"${b.id}" is in the bottom-right corner, where players show the duration.` });
  }

  for (const [, id] of t.prompt.matchAll(/\{([a-z0-9-]+)\}/gi)) {
    if (!texts.some((b) => b.id === id)) issues.push({ message: `The prompt names {${id}}, but no text block has that id.` });
  }
  for (const [where, text] of [["name", t.name], ...t.notes.map((n, i) => [`note ${i + 1}`, n])] as const) {
    const found = fillerWords(text);
    if (found.length) issues.push({ message: `The ${where} uses filler (${found.join(", ")}); say plainly what the design choice does.` });
  }

  return issues;
}
