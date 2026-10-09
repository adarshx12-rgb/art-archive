# Taste Over Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concepts at the level a high-paid designer would deliver, learned the way a child learns: by looking at good reference images, understanding them, trying freely, getting feedback and practising.

**Architecture:** The director's rulebook becomes a creative standard; it sees 2–3 reference images from a private R2 bucket, writes what makes each work, sketches ~8 ideas and develops 3. An art-director critique call compares them with the same images and returns improved concepts (re-checked, with fallback). Offline practice rounds correct gold prompts from the user's renders.

**Tech Stack:** TypeScript, Cloudflare Worker + R2, zod, vitest, OpenRouter/Anthropic vision; Node and Python (Pillow) scripts; no new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-10-09-taste-over-rules-design.md`

## Global Constraints

- Hard promises stay code checks: only the visitor's words quoted; hero is the visitor's subject; palette, locked layouts, restyle limits and placed text kept; supporting elements (`furniture`) carry no words of their own.
- R2 bucket `inspiration-refs`, binding `REFS`, private; thumbnails `<id>.jpg`, ≤768 px, JPEG quality ~80. Never in `public/` or the browser bundle.
- Up to 5 reference images per call (4–5 when the style has them), in G1–G5 order. Image inspection is the main path; text is only a fallback when images cannot be loaded.
- `CONCEPT_CRITIQUE`: `"on"` (default) | `"off"`.
- Artist word guidance: about 180–320 words.
- A critique can never make the result worse than skipping it: on failure, invalid output, or fewer valid concepts, the originals are used.
- Creating the remote R2 bucket was approved by the user on 2026-10-09.
- Claude never generates images; the user renders.
- Match surrounding code: short "why" comments; CRLF files stay CRLF.

## Review Focus

1. Image fetch fails or binding missing (local dev before upload): ideas still work from text (Task 4 test).
2. A provider rejects images: one retry without images, not a failed request (Task 4 test).
3. The critique quotes words the visitor never typed or changes the hero: originals returned (Task 5 test).
4. Removing the caps lets a concept carry worded furniture: still rejected (Task 1 test).
5. A restyle or locked layout: no gold, so no images and an unchanged director input (Task 4 test).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/art/brief.ts` (modify) | drop furniture cap and forced craft from `checkBrief` |
| `worker/concepts.ts` (modify) | creative standard, `sketches` + `observations`, images, critique wiring |
| `worker/design-memory.ts` (modify) | `DESIGN_JUDGMENT`: richness with purpose |
| `worker/prompt.ts` (modify) | artist word range, place every supporting element |
| `worker/refs.ts` (create) | `referenceImages(env, ids)` from R2 |
| `worker/critique.ts` (create) | `critiqueConcepts(...)` |
| `worker/practice.ts` (create) | pure practice logic: `pickPractice`, `applyReview` |
| `scripts/upload-refs.py` (create) | resize + upload thumbnails to R2 |
| `scripts/practice.mjs` (create) | practice `pick` / `review` commands |
| `worker/env.ts`, `wrangler.jsonc` (modify) | `REFS`, `CONCEPT_CRITIQUE` |

---

### Task 1: Drop the extras cap and forced craft from the checks

**Files:** Modify `src/lib/art/brief.ts` (`checkBrief`, the "at most 3 furniture" and "at least one technique or device" rules); test in `src/lib/art/brief.test.ts`.

- [ ] **Step 1: Failing test** (append to `brief.test.ts`, using the file's existing fixture helpers for a valid brief and state):

```ts
it("accepts a rich concept: many supporting elements and no craft ids", () => {
  const rich = { ...validBrief, furniture: ["thin callout lines to the sole", "a sizing grid bottom-left", "a ghosted second shoe mid-step", "motion streaks behind the heel", "a halftone shadow", "a stamp holding \"20% off\""], craft: [] };
  expect(checkBrief(rich, stateWithWords)).toEqual([]);
});
it("still rejects worded furniture and unknown craft", () => {
  expect(checkBrief({ ...validBrief, furniture: ["a sticker reading SALE"] }, stateWithWords).join(" ")).toMatch(/carries words/);
  expect(checkBrief({ ...validBrief, craft: ["made-up"] }, stateWithWords).join(" ")).toMatch(/Unknown craft ids/);
});
```

(Use the names the file already uses for a valid brief and a worded state; if it has none, build them inline from `defaultState()` with `text: "20% off"` and a subject, and a brief whose `hero.subject` is that subject and `type` quotes "20% off".)

- [ ] **Step 2: Run** `npx vitest run src/lib/art/brief.test.ts` — FAIL (furniture cap / craft rule).
- [ ] **Step 3: Implement:** delete the `if (brief.furniture.length > 3)` line and the block that pushes "Use at least one technique or device from the craft list." / "Use at least one technique from the craft list." (keep the unknown-id check). Update other tests that expected those messages to expect acceptance.
- [ ] **Step 4: Run** `npx vitest run` — PASS. **Commit:** `Let concepts be rich: no extras cap, craft is optional`.

### Task 2: The director's creative standard, observations and sketches

**Files:** Modify `worker/concepts.ts` (`SYSTEM`, `ConceptsOut`, `BriefSchema.furniture` description, `concepts()` return), `worker/design-memory.ts` (`DESIGN_JUDGMENT`); tests in `worker/ai.test.ts` (concepts task).

**Produces:** `ConceptsOut = { observations: {ref: string; works: string}[]; sketches: string[]; concepts: Brief[] }`; `concepts()` returns `observations` and `sketches`.

- [ ] **Step 1: Failing tests:**

```ts
it("works to a creative standard, not a rulebook", async () => {
  const calls = fakeFetch({ openrouter: () => reply(...three) });
  await concepts(env(), { query, exclude: [] });
  const system = String((calls[0]!.body.messages as { content: string }[])[0]!.content);
  expect(system).toContain("You are the designer a brand pays well");
  expect(system).not.toMatch(/Method, for each concept|At most three|Zero extras|arbitrary decorative extras/);
});
it("returns the director's rough sketches and observations", async () => {
  fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ observations: [], sketches: ["a", "b", "c", "d", "e", "f", "g", "h"], concepts: three })) });
  const r = await concepts(env(), { query, exclude: [] });
  expect(r.sketches).toHaveLength(8);
  expect(r.observations).toEqual([]);
});
```

Update the test helper `reply(...cs)` to send `{ observations: [], sketches: [], concepts: cs }`.

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.**
  - `SYSTEM`: replace the opening paragraph's job sentence and the whole "Method, for each concept: 1…7" block with:

```text
You are the designer a brand pays well. Deliver what a top studio would for this brief: a rich, layered composition with depth (elements in front of and behind each other), a supporting system of details that rewards a second look, energy and texture, and one clear focal point that reads first. Every element earns its place; cut only what has no job. Use what you have learned from the references, gold prompts and style notes, and your own taste; there is no house style and no checklist. Minimal styles stay minimal when the style and its references call for it.

Work in this order:
1. observations: for each reference you are given (images G1–G3 when attached, otherwise goldPrompts), one line on what makes it work.
2. sketches: about 8 one-line rough ideas for this brief, each a different idea, not variations of one.
3. concepts: develop the three strongest and most different sketches into full concepts, strongest first. When the visitor has fixed the composition or finish, offer only the variations still allowed, even if just one fits. Avoid repeating anything in alreadyShown.
```

  - Hard rules: change "Furniture is wordless graphic extras only (…). At most three." to "Furniture is the supporting system: wordless elements (or ones holding the visitor's quoted words), each placed, as many as the design needs."; replace the craft rule with "The craft list is vocabulary you may use; list any ids you use in craft."
  - `BriefSchema.furniture.describe(...)`: "The supporting system: wordless elements, each with its place, as many as the design needs. Empty for a restyle."
  - `ConceptsOut`: `z.object({ observations: z.array(z.object({ ref: z.string(), works: z.string() })), sketches: z.array(z.string()), concepts: z.array(BriefSchema)… })`.
  - `concepts()` returns `observations: first.data.observations ?? []` and `sketches: first.data.sketches ?? []` (from the first call; a repair keeps them).
  - `DESIGN_JUDGMENT`: replace the "Restraint means…" bullet with "Richness with purpose: add what a senior designer would add (depth, a supporting system of details, texture, energy) and give every element a compositional job; dense is welcome when organised around one focal point; cut only what has no job." In the final bullet, replace "arbitrary decorative extras, generic default hierarchy and technique piled on technique. Remove these." with "a generic default layout, elements with no job, and technique piled on technique. Fix these."
- [ ] **Step 4: Run** `npx vitest run` (fix tests that asserted the old texts) — PASS. **Commit:** `Director works to a creative standard: observations, sketches, then concepts`.

### Task 3: The artist describes rich designs

**Files:** Modify `worker/prompt.ts` (`SYSTEM`, `DIRECTOR`); tests in `worker/ai.test.ts`.

- [ ] **Step 1: Failing test:**

```ts
it("gives the artist room for a rich design and every supporting element", async () => {
  const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed })) });
  await perfectPrompt(env(), { query: punk, brief });
  const system = String((calls[0]!.body.messages as { content: string }[])[0]!.content);
  expect(system).toContain("about 180-320 words");
  expect(system).toContain("Place every supporting element from the concept");
  expect(system).not.toContain("omit if unnecessary");
});
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement:** in `SYSTEM` "about 120-230 words" → "about 180-320 words"; in `DIRECTOR` "about 110-200 words" → "about 180-320 words"; item 5 "Any justified extras from the concept, each with its place; omit if unnecessary." → "Place every supporting element from the concept, each with its place."
- [ ] **Step 4: Run** — PASS. **Commit:** `Artist has room for rich designs`.

### Task 4: Reference images from R2

**Files:** Create `worker/refs.ts`, `worker/refs.test.ts`; modify `worker/env.ts` (`REFS?: R2Bucket`), `wrangler.jsonc` (`"r2_buckets": [{ "binding": "REFS", "bucket_name": "inspiration-refs" }]`), `worker/concepts.ts` (send images), `worker/ai.ts` (retry without images); tests in `worker/ai.test.ts`.

**Produces:** `referenceImages(env: Env, ids: string[]): Promise<string[]>` (at most 5); `concepts()` returns `imagesSeen: number`; director gold retrieval limit 5.

- [ ] **Step 1: Failing tests** (`refs.test.ts`):

```ts
const bucket = (objects: Record<string, string>) => ({ get: async (key: string) => (key in objects ? { arrayBuffer: async () => new TextEncoder().encode(objects[key]).buffer } : null) }) as unknown as R2Bucket;
it("returns data URLs in order, skipping missing objects, at most five", async () => {
  const env = { REFS: bucket({ "a.jpg": "A", "c.jpg": "C", "d.jpg": "D", "e.jpg": "E", "f.jpg": "F", "g.jpg": "G" }) } as Env;
  expect(await referenceImages(env, ["a", "b", "c", "d", "e", "f", "g"])).toEqual(["A", "C", "D", "E", "F"].map((c) => `data:image/jpeg;base64,${btoa(c)}`));
});
it("returns nothing without a binding or when the bucket fails", async () => {
  expect(await referenceImages({} as Env, ["a"])).toEqual([]);
  expect(await referenceImages({ REFS: { get: async () => { throw new Error("down"); } } } as unknown as Env, ["a"])).toEqual([]);
});
```

  In `ai.test.ts` (gold block): with a pool of 6 punk gold references and a bucket holding all of them, the director's user message has 5 `image_url` parts, `goldPrompts` has G1–G5 and the result has `imagesSeen: 5`; an answer whose `observations` miss G4 triggers the repair pass with "Look at image G4"; with no gold (restyle query) there are no image parts and `imagesSeen: 0`; with no `REFS` binding the call still succeeds from text and `imagesSeen: 0`. In the `ask` tests: an OpenRouter 400 whose error mentions "image" retries once without images (second body has a string `content`).

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.**

```ts
// worker/refs.ts
import type { Env } from "./env";

/** Up to five reference images from the private bucket, as data URLs, in the order asked. Any problem means none: the director then works from text. */
export async function referenceImages(env: Env, ids: string[]): Promise<string[]> {
  if (!env.REFS) return [];
  try {
    const out: string[] = [];
    for (const id of ids) {
      if (out.length === 5) break;
      const object = await env.REFS.get(`${id}.jpg`);
      if (!object) continue;
      const bytes = new Uint8Array(await object.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      out.push(`data:image/jpeg;base64,${btoa(binary)}`);
    }
    return out;
  } catch {
    return [];
  }
}
```

  - `concepts()`: `retrieveGold(state, plan, undefined, 5)`; `const images = picked.length ? await referenceImages(env, picked.map((p) => p.gold.id)) : [];` pass `images` to the director `ask` (and the repair call); return `imagesSeen: images.length`. When `images.length`, add `Look at image G<n> and write what makes it work in observations.` to the problems for every G1…Gn without an observation, so the repair pass fills them. Add to `GOLD_RULES`: "When images are attached they are the references G1–G5 in order: look at each one closely, write what makes it work, then make something new at that level; never copy one."
  - `ask` (OpenRouter path): if the response status is 400/415 and the error text matches `/image/i` and `opts.images?.length`, retry once with `images: undefined`.
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc -p worker/tsconfig.json` — PASS. **Commit:** `Director sees the reference images`.

### Task 5: Art-director critique

**Files:** Create `worker/critique.ts`, tests in `worker/ai.test.ts`; modify `worker/concepts.ts`, `worker/env.ts` (`CONCEPT_CRITIQUE?: string`), `wrangler.jsonc` (`"CONCEPT_CRITIQUE": "on"`).

**Produces:** `critiqueConcepts(env, args: { facts: object; system: string; concepts: Brief[]; images: string[]; state: BuilderState; models?: string }, override?): Promise<{ concepts: Brief[]; notes: Note[]; usage: Usage } | null>` where `Note = { title: string; generic: string; push: string; cut: string }`.

- [ ] **Step 1: Failing tests:**
  - On by default: two OpenRouter calls; the second's user JSON contains `concepts` (the first call's) and its system contains "creative director at a top studio"; the result's `concepts` are the critique's (titles changed in the fake reply), `critique` has notes, and `usage.cost` is the sum.
  - `CONCEPT_CRITIQUE: "off"`: one call, `critique` null.
  - The critique returns a concept quoting "FREE BEER" (not typed) for all three: originals returned, `critique` null.
  - The critique call fails (500 twice): originals returned, no throw.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.**

```ts
// worker/critique.ts (shape; use the project's ask/sortBriefs/BriefSchema)
const CritiqueOut = z.object({
  notes: z.array(z.object({ title: z.string(), generic: z.string(), push: z.string(), cut: z.string() })),
  concepts: z.array(BriefSchema),
});
const CRITIC = `You are the creative director at a top studio reviewing your designer's concepts before they go to the client. For each concept, set beside the reference images (G1–G3, when attached) and goldPrompts: does it reach that level? Name what is generic or weak, what a top studio would add or push (depth, a supporting system of details, energy, texture, a bolder idea), and what is clutter with no job. Then return the improved concepts, strongest first, keeping every rule in the brief: the visitor's words exactly, their subject as the hero, their palette and locks. Never copy a reference.`;
```

  `critiqueConcepts` asks with `system: CRITIC + DESIGN_JUDGMENT + gold rules text used by the director`, `user: JSON.stringify({ ...facts, concepts })`, `images`, `effort: "medium"`, `models`; runs `sortBriefs(result.concepts, state)`; returns null if the call throws or `kept.length < concepts.length`. In `concepts()`, after `kept` is final and when `env.CONCEPT_CRITIQUE !== "off"`, call it; on a result use its concepts, add its usage, and return `critique: notes`; otherwise `critique: null`.
- [ ] **Step 4: Run** `npx vitest run`, both typechecks, `npm run build` — PASS. **Commit:** `Art-director critique improves the concepts`.

### Task 6: Upload the thumbnails

**Files:** Create `scripts/upload-refs.py`.

- [ ] **Step 1: Write the script:** read `worker/data/gold-prompts.json` ids and `inspiration/.study/inventory.json` (id = first 16 chars of `imageHash`); for each usable id whose hash differs from `inspiration/.study/refs-uploaded.json`, open `inspiration/.study/<hash>.jpg`, resize to fit 768 px, save to a temp JPEG (quality 80), run `npx wrangler r2 object put inspiration-refs/<id>.jpg --file <tmp> --content-type image/jpeg` plus `--local` or `--remote` (flag argument, default `--local`); delete objects for ids no longer usable (`wrangler r2 object delete`); write the manifest per target (`refs-uploaded-local.json` / `refs-uploaded-remote.json`). Print counts and total bytes.
- [ ] **Step 2: Run** `python scripts/upload-refs.py --local` — expected: 215 uploaded, ~15 MB.
- [ ] **Step 3: Remote — ASK THE USER FIRST:** `npx wrangler r2 bucket create inspiration-refs`, then `python scripts/upload-refs.py --remote`. Skip if the user declines; local dev still works.
- [ ] **Step 4: Commit** the script. **Commit:** `Upload reference thumbnails to the private bucket`.

### Task 9: Practice rounds (last; only after Task 7 passes and the user confirms)

**Files:** Create `worker/practice.ts`, `worker/practice.test.ts`, `scripts/practice.mjs`.

**Produces:** `pickPractice(refs: { id: string; folders: string[] }[], history: Record<string, string>, n: number): string[]` (least-practised folders first, one per folder per round, skipping ids practised in the last 30 days; `history` maps id → ISO date); `applyReview(goldRecord: object, review: { similar: "close" | "partly" | "far"; missed: string[]; corrected: GoldAnswer }): { record: object; previous: object }`.

- [ ] **Step 1: Failing tests:** `pickPractice` picks from distinct folders, prefers folders with fewer practised ids, skips recent ids, returns at most n; `applyReview` replaces `gold` with `corrected`, adds `practice: { similar, missed, at }`, and returns the previous record unchanged.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** the two pure functions (imports with `.ts` extensions so the script can load them); `scripts/practice.mjs pick --n 6` writes `output/practice/<date>/sheet.md` and updates `inspiration/.study/practice-history.json`; `review <date>` sends each `practice-<id>.png` with its original thumbnail to the vision model (`google/gemini-3.8-flash`, JSON schema `{ similar, missed, corrected: GoldSchema }`), writes `review.md`, saves `<hash>.gold-v1.prev.json` and the updated record, then runs `node scripts/gold-prompts.mjs --compile-only`. Prints cost.
- [ ] **Step 4: Run** tests — PASS; `node scripts/practice.mjs pick --n 6` — writes a sheet. **Commit:** `Practice rounds: recreate, render, review, improve gold prompts`.

### Task 7: End-to-end check

- [ ] **Step 1:** Local: `python scripts/upload-refs.py --local`, `npm run dev`, then a harness over 8+ briefs across styles against `http://localhost:5173/api/concepts` and `/api/prompt`. For each: concepts returned; `imagesSeen` = picked references (4–5 where the style has them); observations cover every image; critique ran (`critique` not null); prompt returned with no invented-word warnings. Report in `output/e2e/report.md`.
- [ ] **Step 2:** Remote: `npx wrangler r2 bucket create inspiration-refs` (approved), `python scripts/upload-refs.py --remote`, and check two objects with `wrangler r2 object get`. Deploy only if the user asks.
- [ ] **Step 3:** Fix every glitch (failing test first), rerun until the report is clean. **Commit** fixes.

### Task 8: Comparison test

- [ ] **Step 1:** Harness (scratchpad) from the A/B one: arm `then` = the chain at commit `893a0ab` (before this work) via a `git worktree` of that commit with `node_modules` linked; arm `now` = this work, critique on, local R2 filled. Concept slot 1 in both.
- [ ] **Step 2:** Run the 8 briefs from `output/abtest/briefs.json` (~$1). Write `output/abtest2/prompts.md` (blind, shuffled), `key.json`, and `notes.md` with each "now" brief's observations, sketches and critique notes.
- [ ] **Step 3:** Read every "now" prompt for clutter, broken promises and invented words; fix and rerun on a defect.
- [ ] **Step 4: CHECKPOINT — the user renders 16 images** at 4:5 and records blind picks. Win: "now" on ≥ 5 of 8 and winners not called generic. Otherwise review sketches and critique notes with the user before changing anything.
