import data from "./data/gold-prompts.json";
import { PLACEHOLDER, type GoldReference } from "./gold-schema";
import { designIntent } from "./design-memory";
import type { ContentPlan } from "../src/lib/plan/plan";
import { styleFor, type BuilderState } from "../src/lib/prompt/state";

/**
 * Picks the gold prompts (worked examples from the inspiration folder, see
 * gold-schema.ts) closest to a brief, for the director to adapt. Server-only:
 * the compiled file never reaches the browser.
 */

const compiled = data.references as GoldReference[];
let override: GoldReference[] | null = null;
/** Tests replace the compiled pool; null restores it. */
export function setGoldPool(pool: GoldReference[] | null) {
  override = pool;
}

export type Transfer = "within-style" | "structure-only";
export interface PickedGold {
  gold: GoldReference;
  transfer: Transfer;
  score: number;
}

const textLoadFor = (words: number) => (words === 0 ? "none" : words <= 3 ? "light" : "heavy");

export function retrieveGold(state: BuilderState, plan: ContentPlan, pool: GoldReference[] = override ?? compiled, limit = 3): PickedGold[] {
  const style = styleFor(state);
  const intent = designIntent(state);
  const words = plan.items.filter((i) => i.kind === "words" || (i.kind === "image" && i.ref.startsWith("words from"))).length;
  const roles = new Set(plan.items.map((i) => i.role));
  const hasSubject = plan.items.some((i) => i.kind === "subject" || (i.kind === "image" && i.role === "hero"));
  // What another style's reference must share to lend its structure: the same organisation (and medium, when the brief names one).
  const structure = intent.structure ?? (hasSubject ? "single-focus" : intent.hasWords ? "type-led" : null);

  const scored = pool.flatMap((gold) => {
    const exact = !!style && gold.folders.includes(style.slug);
    if (!exact && (gold.structure !== structure || (intent.medium && intent.medium !== gold.medium))) return [];
    let score = exact ? 24 : 0;
    score += gold.kind === plan.kind ? 10 : gold.kind === "other" || plan.kind === "other" ? 4 : 0;
    const shared = gold.roles.filter((r) => roles.has(r)).length;
    const lacking = [...roles].filter((r) => !gold.roles.includes(r)).length;
    score += 3 * shared - Math.min(8, 2 * lacking);
    score += gold.textLoad === textLoadFor(words) ? 4 : -3;
    if (gold.density === intent.density) score += 4;
    // A type-only design cannot teach a brief with no words.
    if (!intent.hasWords && gold.medium === "typography") score -= 40;
    if (gold.quality === "strong") score += 2;
    return score > 8 ? [{ gold, transfer: (exact ? "within-style" : "structure-only") as Transfer, score }] : [];
  });
  scored.sort((a, b) => b.score - a.score || a.gold.id.localeCompare(b.gold.id));
  const picked: PickedGold[] = [];
  for (const s of scored) if (picked.length < limit && !picked.some((p) => p.gold.id === s.gold.id)) picked.push(s);
  return picked;
}

export const goldById = (id: string) => (override ?? compiled).find((g) => g.id === id);

/** Placeholders the writer failed to fill: printed, they would end up lettered on the artwork. */
export const placeholdersLeft = (prompt: string) => [...prompt.matchAll(new RegExp(PLACEHOLDER.source, "g"))].map((m) => m[0]);

/** The reference's own colours outside the Avoid line, unless the visitor chose them too. */
export function referenceColours(prompt: string, gold: GoldReference, chosen: string[]): string[] {
  const body = ` ${prompt.split(/\bAvoid:/i)[0]!.toLowerCase()} `;
  const mine = new Set(chosen.map((c) => c.toLowerCase()));
  const found: string[] = [];
  for (const { name, hex } of gold.colours) {
    if (!mine.has(name.toLowerCase()) && new RegExp(`[^a-z]${name.toLowerCase().replace(/[^a-z0-9 ]/g, "")}[^a-z]`).test(body)) found.push(name);
    if (!mine.has(hex.toLowerCase()) && body.includes(hex.toLowerCase())) found.push(hex);
  }
  return found;
}

const words = (text: string) => text.replace(new RegExp(PLACEHOLDER.source, "g"), " ").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);

/** The first run of n words the prompt shares with its reference: a copy, not an adaptation. */
export function copiedRun(prompt: string, gold: GoldReference, n = 12): string | null {
  const source = words(gold.prompt);
  const runs = new Set(source.slice(0, Math.max(0, source.length - n + 1)).map((_, i) => source.slice(i, i + n).join(" ")));
  const mine = words(prompt);
  for (let i = 0; i + n <= mine.length; i++) {
    const run = mine.slice(i, i + n).join(" ");
    if (runs.has(run)) return run;
  }
  return null;
}

/** The gold prompts as the models see them. Another style's reference lends only its hero and layout, not its palette, letterforms or finish. */
export function goldForModel(picked: PickedGold[]) {
  return picked.map(({ gold, transfer }, i) => ({
    ref: `G${i + 1}`,
    transfer,
    prompt: transfer === "within-style" ? gold.prompt : [gold.sections.hero, gold.sections.layout].join("\n"),
  }));
}
