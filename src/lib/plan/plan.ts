import { HIERARCHY, ROLES, type DesignKind, type Role } from "../../content/hierarchy-patterns";
import { textSources, typedWords } from "../art/brief";
import { cleanComment, cleanSubject, type BuilderState } from "../prompt/state";
import { aspectOf, projectScene, shotCamera } from "../scene/camera";
import { imageUse } from "../scene/describe";

/**
 * The content plan: what the piece contains, in the order a viewer should
 * read it, with each item's role, priority and lock. It decides *what* is
 * said and in what order, never how it looks; that is the art director's job.
 *
 * basePlan builds it by rules and the reading-order priors mined from TASTE
 * (content/hierarchy-patterns.ts). The Worker's planner may refine roles,
 * order and the message, but checkPlan only accepts an answer with exactly
 * the same items, and locks always come from here.
 */

export interface PlanItem {
  /** The user's own words (one line), a subject's label, or a picture ("image 2", "words from image 2"). */
  ref: string;
  kind: "words" | "subject" | "image";
  role: Role;
  /** 1 reads first and largest; 3 is small supporting information. */
  priority: 1 | 2 | 3;
  /** What must not change, or null when the designer is free. */
  locked: string | null;
}

export interface ContentPlan {
  kind: DesignKind;
  /** One line on what the piece says and for whom, or null before a planner has written one. */
  message: string | null;
  /** "preserve": the layout is fixed (a restyle keeping its composition, or a template), so do not reorder it on the page. */
  layout: "free" | "preserve";
  items: PlanItem[];
  source: "rules" | "ai";
}

const PRIORITY: Record<Role, 1 | 2 | 3> = { headline: 1, hero: 1, brand: 2, subhead: 2, offer: 2, cta: 2, body: 3, contact: 3, detail: 3 };

const CONTACT = [
  /@|\bwww\.|https?:\/\/|\.(?:com|net|org|my|sg|io|co)\b/i,
  // A phone number: a run of at least 7 digits, allowing spaces, dashes and a leading +.
  /(?:\+?\d[\d\s-]{6,}\d)/,
  // A street address or a five- or six-digit postcode.
  /\b(?:jalan|jln|taman|lorong|street|st\.|road|rd\.?|avenue|ave\.?|lane|blvd|boulevard|floor|suite|unit|block|blk)\b/i,
  /\b\d{5,6}\b/,
];
const CTA = /^(?:book|call|order|visit|shop|get|join|register|buy|sign up|subscribe|download|reserve|contact|enquire|apply|learn more|find out|try|start|discover)\b|\bnow[.!]?$/i;
const OFFER = /\d+\s?%|\b(?:rm|usd|sgd|\$|£|€)\s?\d|\d\s?(?:rm|usd|sgd)\b|\b(?:free|off|discount|sale|deal|save|only)\b/i;

const WHEN = /\b(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|nesday|urday|sday|rsday)?s?\b|\b(?:jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\bmay\b(?=\s*\d)|\d\s*(?:am|pm)\b|\b\d{1,2}[:.]\d{2}\b/gi;
const WHEN_FILLER = /\b(?:at|from|to|every|doors|open|opens|until|till|and|on|the|daily|weekly|nightly|\d+(?:st|nd|rd|th)?)\b|[\d,–—\-/:.]+/gi;

/** A date or time line ("Sat 14 Nov, 8pm", "Doors 7:30 pm"): a detail, not a headline, unless the planner decides the piece is about the date. */
function isWhen(line: string): boolean {
  if (!line.match(WHEN)) return false;
  const rest = line.replace(WHEN, " ").replace(WHEN_FILLER, " ").trim();
  return rest.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length <= 1;
}

/** A line's role when its wording gives it away: contact details, a call to action, an offer, or a date. */
export function roleOf(line: string): Role | null {
  if (CONTACT.some((re) => re.test(line))) return "contact";
  if (CTA.test(line.trim())) return "cta";
  if (OFFER.test(line)) return "offer";
  if (isWhen(line)) return "detail";
  return null;
}

const KINDS_BY_FORMAT: Record<NonNullable<BuilderState["format"]>, DesignKind> = { poster: "poster", flyer: "flyer", magazine: "magazine", thumbnail: "thumbnail" };

export function basePlan(state: BuilderState): ContentPlan {
  const kind: DesignKind = state.format ? KINDS_BY_FORMAT[state.format] : "other";
  const layout = (state.task === "restyle" && state.preserve.includes("composition")) || state.template ? "preserve" : "free";
  const placed = new Set(state.actors.filter((a) => a.glyph === "text").map((a) => a.label));
  const items: PlanItem[] = [];
  const add = (ref: string, kind: PlanItem["kind"], role: Role, locked: string | null) => items.push({ ref, kind, role, priority: PRIORITY[role], locked });

  // Copy: lines whose wording names their role first, then headline, subhead and body in the order given.
  const copy: { ref: string; kind: PlanItem["kind"]; locked: string }[] = [
    ...typedWords(state).map((w) => ({ ref: w, kind: "words" as const, locked: placed.has(w) ? "exact words, placed position" : "exact words" })),
    ...textSources(state).map((label) => ({ ref: `words from ${label}`, kind: "image" as const, locked: "exact words" })),
  ];
  const plain = ["headline", "subhead"] as const;
  let next = 0;
  for (const c of copy) {
    const role = (c.kind === "words" ? roleOf(c.ref) : null) ?? plain[next++] ?? "body";
    add(c.ref, c.kind, role, c.locked);
  }

  // Pictures by what they are for; a look-only picture lends style, not content.
  const pictures = state.actors.filter((a) => a.glyph === "image");
  if (pictures.length) {
    const projected = projectScene(shotCamera(state), state.actors);
    const comments = state.comments.map((c) => ({ ...c, text: cleanComment(c.text) })).filter((c) => c.text);
    const num = (label: string) => Number(label.match(/\d+/)?.[0] ?? Infinity);
    for (const p of projected.filter((p) => p.glyph === "image").sort((a, b) => num(a.label) - num(b.label))) {
      const use = imageUse(p, projected, aspectOf(state.aspect), comments);
      if (use === "logo") add(p.label, "image", "brand", "reproduce exactly");
      else if (use === "product") add(p.label, "image", "hero", "reproduce exactly");
      else if (use === "face") add(p.label, "image", "hero", "keep likeness");
      else if (use === undefined) add(p.label, "image", "detail", "include as it is");
    }
  }

  // Subjects: the first is the hero, the rest support it.
  const subjects = [...state.actors.filter((a) => a.glyph !== "text" && a.glyph !== "image").map((a) => a.label), cleanSubject(state.subject)].filter(Boolean);
  subjects.forEach((s, i) => add(s, "subject", i === 0 ? "hero" : "detail", null));

  // Reading order: the design kind's mined order, ties kept in the order given.
  const rank = new Map(HIERARCHY[kind].order.map((r, i) => [r, i]));
  const at = (r: Role) => rank.get(r) ?? rank.size;
  const ordered = items.map((item, i) => ({ item, i })).sort((a, b) => at(a.item.role) - at(b.item.role) || a.i - b.i).map(({ item }) => item);
  return { kind, message: null, layout, items: ordered, source: "rules" };
}

/** What a planner model answers: the same items, reordered, with roles and priorities. */
export interface PlanAnswer {
  message: string;
  items: { ref: string; role: string; priority: number }[];
}

/**
 * The model's plan, if it keeps exactly the base plan's items (each once, none
 * invented) with known roles and priorities. Kinds and locks always come from
 * the base plan. null means: use the base plan.
 */
export function checkPlan(answer: PlanAnswer, base: ContentPlan): ContentPlan | null {
  const byRef = new Map(base.items.map((i) => [i.ref, i]));
  const refs = answer.items.map((i) => i.ref);
  if (refs.length !== byRef.size || new Set(refs).size !== refs.length || refs.some((r) => !byRef.has(r))) return null;
  const items: PlanItem[] = [];
  for (const a of answer.items) {
    if (!ROLES.includes(a.role as Role) || ![1, 2, 3].includes(a.priority)) return null;
    const own = byRef.get(a.ref)!;
    items.push({ ref: a.ref, kind: own.kind, role: a.role as Role, priority: a.priority as 1 | 2 | 3, locked: own.locked });
  }
  const message = answer.message.replace(/\s+/g, " ").trim().slice(0, 160) || null;
  return { ...base, message, items, source: "ai" };
}
