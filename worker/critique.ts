import { z } from "zod";
import type { Brief } from "../src/lib/art/brief";
import { ask, type Usage } from "./ai";
import type { Env } from "./env";

/**
 * The art-director pass: a creative director at a top studio reviews the
 * designer's concepts beside the same reference images and returns better
 * ones. Its answer must pass the same checks as the designer's; anything
 * less and the designer's concepts stand, so it can only help.
 */

export const CRITIC = `You are the creative director at a top studio reviewing your designer's concepts before they go to the client. For each concept, set it beside the reference images (imagesShow lists which refs they show) and goldPrompts: does it reach that level? Name what is generic or weak, what a top studio would add or push (depth, a supporting system of details, energy, texture, a bolder idea), and what is clutter with no job. Then return the improved concepts, strongest first, keeping every rule in the brief below: the visitor's words exactly, their subject as the hero, their palette and locks. Never copy a reference.

The designer's brief, which still applies in full:
`;

const Note = z.object({
  title: z.string().describe("The concept's title as the designer wrote it."),
  generic: z.string().describe("What is generic or weak about it, set beside the references."),
  push: z.string().describe("What a top studio would add or push."),
  cut: z.string().describe("What is clutter with no job, or 'nothing'."),
});
export type CritiqueNote = z.infer<typeof Note>;

export async function critiqueConcepts(
  env: Env,
  args: {
    /** The designer's system text and facts, so the critic works to the same brief. */
    system: string;
    facts: object;
    concepts: Brief[];
    images: string[];
    models?: string;
    briefSchema: z.ZodType<Brief>;
    /** The designer's checks: the improved concepts that pass, in order. */
    check: (concepts: Brief[]) => { kept: Brief[]; problems: string[] };
  },
  override?: string | null,
): Promise<{ concepts: Brief[]; notes: CritiqueNote[]; usage: Usage } | null> {
  const CritiqueOut = z.object({
    notes: z.array(Note),
    concepts: z.array(args.briefSchema).describe("The improved concepts, strongest first."),
  });
  try {
    const r = await ask(
      env,
      { system: CRITIC + args.system, user: JSON.stringify({ ...args.facts, concepts: args.concepts }), schema: CritiqueOut, name: "critique", effort: "medium", models: args.models, images: args.images },
      override,
    );
    // Slot by slot: an improved concept that passes the checks replaces the designer's; one that
    // does not leaves the designer's in place. One doubtful concept never throws the rest away.
    const improved = r.data.concepts as Brief[];
    const failed: string[] = [];
    const merged = args.concepts.map((original, i) => {
      const candidate = improved[i];
      if (!candidate) return { brief: original, improved: false };
      const { kept, problems } = args.check([candidate]);
      if (kept.length === 1) return { brief: kept[0]!, improved: true };
      failed.push(...problems.map((p) => p.replace(/^Concept 1/, `Concept ${i + 1}`)));
      return { brief: original, improved: false };
    });
    if (failed.length) console.warn(`critique kept the designer's version where its own failed the checks: ${failed.join(" | ")}`);
    if (!merged.some((m) => m.improved)) return null;
    // The mix must still be a valid, distinct set.
    const set = args.check(merged.map((m) => m.brief));
    if (set.kept.length < args.concepts.length) {
      console.warn(`critique kept the designer's concepts: the mixed set failed: ${set.problems.join(" | ")}`);
      return null;
    }
    return { concepts: set.kept, notes: r.data.notes, usage: r.usage };
  } catch (e) {
    console.warn("critique kept the designer's concepts:", e instanceof Error ? e.message : e);
    return null;
  }
}
