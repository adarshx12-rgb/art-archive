import { getCraft, type CraftKind } from "../../content/craft";
import { getTemplate, slotText } from "../../content/templates";
import { cleanSubject, cleanText, type BuilderState } from "../prompt/state";

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
}

/** Every word the visitor asked to letter: template blocks, text on the sketch, then the text box. */
export function typedWords(state: BuilderState): string[] {
  const template = state.template ? getTemplate(state.style, state.template) : undefined;
  const blocks = template ? Object.values(slotText(template, state.templateText)) : [];
  return [...new Set([...blocks, ...state.actors.filter((a) => a.glyph === "text").map((a) => a.label), cleanText(state.text)].filter(Boolean))];
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
  };
}

/** Furniture that mentions words, figures or dates without quoting the visitor's own. */
const WORDED = /\b(reading|saying|says|text|lettering|words?|caption|slogan|tagline|labell?ed|price|date|numbers?|numerals?|digits?)\b|\bstamp(?:ed)? with\b/i;
/** Prices, long numbers and capitalised words: text in disguise. */
const FIGURES = /\$\d|\d{3,}|\b[A-Z]{2,}\b/;

/** What's wrong with a brief, as instructions the model can act on. Empty when it's fine. */
export function checkBrief(brief: Brief, state: BuilderState): string[] {
  const problems: string[] = [];
  const restyle = state.task === "restyle";
  const words = new Set(typedWords(state).map(norm));
  const subjects = subjectNames(state);

  const texts = [brief.title, brief.idea, brief.hero.subject, brief.hero.treatment, brief.hero.scale, brief.device, ...brief.furniture, brief.type, brief.colour, brief.finish, brief.motion].filter((x): x is string => Boolean(x));
  for (const q of new Set(texts.flatMap(quoted))) if (!words.has(norm(q))) problems.push(`"${q}" isn't one of the visitor's words; quote only their words, or none.`);

  if (restyle) {
    if (brief.hero.subject || brief.hero.scale || brief.device || brief.type || brief.furniture.length) problems.push("A restyle keeps the visitor's picture: leave hero.subject, hero.scale, device and type null and furniture empty.");
  } else if (subjects.length) {
    const hero = brief.hero.subject ?? "";
    if (!subjects.some((s) => namesSubject(hero, s))) problems.push(`The hero must be one of the visitor's subjects: ${subjects.join(", ")}.`);
  } else if (brief.hero.subject) {
    problems.push("There are no subjects, so the hero must be the lettering or a pure graphic shape: set hero.subject to null.");
  }

  if (brief.furniture.length > 3) problems.push("Use at most 3 furniture items.");
  if (!words.size) {
    if (brief.type) problems.push("The visitor typed no words: set type to null and letter nothing.");
    const lettering = brief.craft.filter((id) => getCraft(id)?.lettering);
    if (lettering.length) problems.push(`The visitor typed no words, so drop the craft that needs lettering: ${lettering.join(", ")}.`);
  }
  for (const f of brief.furniture) if ((WORDED.test(f) || FIGURES.test(f)) && !quoted(f).length) problems.push(`Furniture "${f}" carries words; furniture must be wordless.`);

  const unknown = brief.craft.filter((id) => !getCraft(id));
  if (unknown.length) problems.push(`Unknown craft ids: ${unknown.join(", ")}. Use ids from the craft list.`);
  const kinds = new Set(brief.craft.map((id) => getCraft(id)?.kind));
  if (restyle ? !kinds.has("technique") : !kinds.has("technique") && !kinds.has("device")) {
    problems.push(restyle ? "Use at least one technique from the craft list." : "Use at least one technique or device from the craft list.");
  }
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
