import { getCraft, type CraftKind } from "../../content/craft";
import { getTemplate, slotText } from "../../content/templates";
import { cleanComment, cleanSubject, copyLines, type BuilderState } from "../prompt/state";
import { aspectOf, projectScene, shotCamera } from "../scene/camera";
import { imageUse } from "../scene/describe";
import { incompatibleCraft, sourceColourConflict } from "./constraints";

/**
 * A design concept for one image: the art director's decisions on top of
 * the visitor's facts. The rules here are shared by the Worker (to check
 * what the model wrote) and the builder (for the type).
 */
export interface Brief {
  /** Card headline, 2–4 plain words. */
  title: string;
  /** One sentence a non-designer understands. */
  idea: string;
  hero: { subject: string | null; treatment: string; scale: string | null };
  device: string | null;
  /** 0–3 wordless graphic extras, each placed. */
  furniture: string[];
  /** Hierarchy of the visitor's own words, quoted exactly. */
  type: string | null;
  colour: string | null;
  finish: string;
  /** Craft library ids used. */
  craft: string[];
  /** Video only: how the key frame moves. */
  motion: string | null;
  /** The gold prompt this concept adapts (worker/gold.ts), and what it takes from it. */
  reference?: { ref: string; takes: string } | null;
}

/** Every word the visitor asked to letter: template blocks, text on the sketch, then the text box. */
export function typedWords(state: BuilderState): string[] {
  const template = state.template ? getTemplate(state.style, state.template) : undefined;
  const blocks = template ? Object.values(slotText(template, state.templateText)) : [];
  return [...new Set([...blocks, ...state.actors.filter((a) => a.glyph === "text").map((a) => a.label), ...copyLines(state.text)].filter(Boolean))];
}

/**
 * Pictures whose words are the visitor's copy ("image 2"): set to "Text /
 * content only", or pinned with a comment like "keep the text". Their words
 * count as the visitor's, but nobody here can read them, so they are lettered
 * by reference, never quoted.
 */
export function textSources(state: BuilderState): string[] {
  if (!state.actors.some((a) => a.glyph === "image")) return [];
  const projected = projectScene(shotCamera(state), state.actors);
  const comments = state.comments.map((c) => ({ ...c, text: cleanComment(c.text) })).filter((c) => c.text);
  return projected
    .filter((p) => p.glyph === "image" && imageUse(p, projected, aspectOf(state.aspect), comments) === "text")
    .map((p) => p.label)
    .sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
}

/** The visitor's subjects: things placed on the sketch, then the subject box. */
export function subjectNames(state: BuilderState): string[] {
  return [...state.actors.filter((a) => a.glyph !== "text" && a.glyph !== "image").map((a) => a.label), cleanSubject(state.subject)].filter(Boolean);
}

/** Text inside double or single quotes, straight or curly. A single quote inside a word (an apostrophe) doesn't count, nor does a one-letter span ('n'). */
export function quoted(s: string): string[] {
  return [...s.matchAll(/"([^"]+)"|“([^”]+)”|‘([^’]{2,})’|(?<![\w'])'([^'\n]{2,}?)'(?!\w)/g)].map((m) => (m[1] ?? m[2] ?? m[3] ?? m[4])!.trim()).filter(Boolean);
}

const norm = (s: string) => s.toLowerCase().replace(/\b(a|an|the)\b/g, " ").replace(/\s+/g, " ").trim();

/**
 * The visitor's own words: one of their lines, or a run of whole words from one,
 * as when "LAST ROUND" is stacked as "LAST" over "ROUND". Nothing is invented by
 * splitting; a changed or partial word still is.
 */
export function ownWords(quote: string, lines: string[]): boolean {
  const q = norm(quote).split(" ").filter(Boolean);
  if (!q.length) return false;
  return lines.some((line) => {
    const l = norm(line).split(" ").filter(Boolean);
    for (let i = 0; i + q.length <= l.length; i++) if (q.every((w, j) => w === l[i + j])) return true;
    return false;
  });
}
/** Words that carry meaning, for matching a hero to a subject. */
const LINKS = new Set(["with", "of", "in", "on", "and", "at", "to", "from", "his", "her", "their", "its"]);
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter((t) => t && !LINKS.has(t));

/** The hero names this subject: a shortening of it, or it with at most two details added (no extra objects). */
function namesSubject(hero: string, subject: string): boolean {
  const h = tokens(hero);
  const s = tokens(subject);
  if (!h.length || !s.length) return false;
  if (h.every((t) => s.includes(t))) return true;
  return s.every((t) => h.includes(t)) && h.filter((t) => !s.includes(t)).length <= 2;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const opt = (s: string | null, n: number) => (s?.trim() ? cut(s.trim(), n) : null);

export function tidyBrief(b: Brief): Brief {
  return {
    title: cut(b.title.trim(), 40),
    idea: cut(b.idea.trim(), 220),
    hero: { subject: opt(b.hero.subject, 120), treatment: cut(b.hero.treatment.trim(), 220), scale: opt(b.hero.scale, 160) },
    device: opt(b.device, 220),
    furniture: b.furniture.map((f) => f.trim()).filter(Boolean).map((f) => cut(f, 120)),
    type: opt(b.type, 260),
    colour: opt(b.colour, 160),
    finish: cut(b.finish.trim(), 160),
    craft: [...new Set(b.craft.map((c) => c.trim()).filter(Boolean))],
    motion: opt(b.motion, 220),
    reference: b.reference ? { ref: cut(b.reference.ref.trim(), 8), takes: cut(b.reference.takes.trim(), 160) } : null,
  };
}

/** Furniture that mentions words, figures or dates without quoting the visitor's own. */
const WORDED = /\b(reading|saying|says|text|lettering|words?|caption|slogan|tagline|labell?ed|price|date|numbers?|numerals?|digits?)\b|\bstamp(?:ed)? with\b/i;
/** Prices, long numbers and capitalised words: text in disguise. */
const FIGURES = /\$\d|\d{3,}|\b[A-Z]{2,}\b/;
// Negations ("with no readable words") and references to the visitor's own copy ("holding the price",
// "behind the footer text") describe a wordless element; only new text it would carry counts.
const affirmative = (s: string) =>
  s.replace(/\b(?:no|without|never|free of|not)\b[^,.;]*/gi, " ").replace(/\b(?:the|their|its)\s+(?:\w+\s+){0,2}(?:text|lettering|words?|price|date|numbers?|copy|details?|headline|line)\b/gi, " ");

/** What's wrong with a brief, as instructions the model can act on. Empty when it's fine. */
export function checkBrief(brief: Brief, state: BuilderState): string[] {
  const problems: string[] = [];
  const restyle = state.task === "restyle";
  const words = new Set(typedWords(state).map(norm));
  const subjects = subjectNames(state);

  const texts = [brief.title, brief.idea, brief.hero.subject, brief.hero.treatment, brief.hero.scale, brief.device, ...brief.furniture, brief.type, brief.colour, brief.finish, brief.motion].filter((x): x is string => Boolean(x));
  const conflicts = incompatibleCraft(state);
  for (const problem of new Set(brief.craft.map((id) => conflicts.get(id)).filter((p): p is string => Boolean(p)))) problems.push(problem);
  if (restyle && state.preserve.includes("colours") && sourceColourConflict(texts.join(". "))) problems.push("Preserve source colours: use their existing darkest/lightest tones for outlines and grounds, not new black ink, white/yellowed paper, or a reduced ink palette.");
  for (const q of new Set(texts.flatMap(quoted))) if (!ownWords(q, typedWords(state))) problems.push(`"${q}" isn't one of the visitor's words; quote only their words, or none.`);

  if (restyle) {
    if (brief.hero.subject || brief.hero.scale || brief.device || brief.type || brief.furniture.length) problems.push("A restyle keeps the visitor's picture: leave hero.subject, hero.scale, device and type null and furniture empty.");
  } else if (subjects.length) {
    const hero = brief.hero.subject ?? "";
    if (!subjects.some((s) => namesSubject(hero, s))) problems.push(`The hero must be one of the visitor's subjects: ${subjects.join(", ")}.`);
  } else if (brief.hero.subject) {
    problems.push("There are no subjects, so the hero must be the lettering or a pure graphic shape: set hero.subject to null.");
  }

  if (!words.size && !textSources(state).length) {
    if (brief.type) problems.push("The visitor typed no words: set type to null and letter nothing.");
    const lettering = brief.craft.filter((id) => getCraft(id)?.lettering);
    if (lettering.length) problems.push(`The visitor typed no words, so drop the craft that needs lettering: ${lettering.join(", ")}.`);
  }
  // "with no readable words" describes a wordless element; only what it affirmatively carries counts.
  for (const f of brief.furniture) if ((WORDED.test(affirmative(f)) || FIGURES.test(affirmative(f))) && !quoted(f).length) problems.push(`Furniture "${f}" carries words; furniture must be wordless.`);

  const unknown = brief.craft.filter((id) => !getCraft(id));
  if (unknown.length) problems.push(`Unknown craft ids: ${unknown.join(", ")}. Use ids from the craft list.`);
  return problems;
}

const pick = (b: Brief, kind: CraftKind) => b.craft.find((id) => getCraft(id)?.kind === kind) ?? "";

/** Indexes of concepts that repeat an earlier one's technique and device. */
export function checkSet(briefs: Brief[]): number[] {
  const seen = new Set<string>();
  const dupes: number[] = [];
  briefs.forEach((b, i) => {
    const key = `${pick(b, "technique")}|${pick(b, "device")}`;
    if (key !== "|" && seen.has(key)) dupes.push(i);
    seen.add(key);
  });
  return dupes;
}

/** Words that make image models reach for their generic default look. */
const SLOP = /\b(stunning|vibrant|highly detailed|hyper-detailed|8k|4k|masterpiece|cinematic|intricate|epic|trending on artstation|trending|award-winning|breathtaking|ultra-realistic)\b,?\s*/gi;

/** Remove filler words, except inside quoted lettering or where the facts themselves use them. */
export function stripSlop(prompt: string, keep: string): string {
  const facts = keep.toLowerCase();
  return prompt
    .split(/("[^"]*"|“[^”]*”)/)
    .map((part, i) => (i % 2 ? part : part.replace(SLOP, (m, word: string) => (facts.includes(word.toLowerCase()) ? m : ""))))
    .join("")
    .replace(/,\s*([.;:])/g, "$1")
    .replace(/[ \t]+([.,;:])/g, "$1")
    .replace(/^([ \t]*)([.,;:]\s*)/gm, "$1")
    .replace(/[ \t]{2,}/g, " ");
}
