# Content Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before the art director designs anything, a Planner turns everything the user gave (typed lines, placed text, subjects, added pictures, comments, format) into a content plan: what the piece says, every item in reading order with its role and priority, and what is locked.

**Architecture:** Three layers. (1) `hierarchy-patterns.ts`: reading-order priors per design kind, mined once from the 720 designer-written briefs in the TASTE dataset. (2) `basePlan(state)`: a pure, deterministic plan built by rules and those priors — always available, unit-tested, and the source of every lock. (3) `planFor(env, state)` in the Worker: Gemini 3.5 Flash-Lite refines roles, order and the one-line message; its answer is validated against the base plan (same items, each once, locks untouchable) and falls back to the base plan on any failure. The Director (`/api/concepts`) and the Artist (`/api/prompt`) receive the plan as input.

**Tech Stack:** TypeScript, Cloudflare Worker, zod, vitest, OpenRouter; Node script (no new dependencies) for mining.

**Spec:** The design agreed in session on 2026-10-09: Planner (content and structure) → Director (Claude Sonnet 5.5) → Artist (Kimi K3) → deterministic checks. Planner model chosen by the user: Gemini 3.5 Flash-Lite, Claude Haiku 5.5 as fallback.

## Global Constraints

- Planner models: `OPENROUTER_PLANNER_MODELS = "google/gemini-3.5-flash-lite,anthropic/claude-haiku-5.5"`.
- The plan never invents content: every item's `ref` is one of the user's own lines, subject labels or pictures; the model may only reorder, assign roles/priorities and write `message`.
- Locks come only from code (`basePlan`), never from the model.
- A planner failure must never fail the user's request: fall back to `basePlan`.
- No new npm dependencies. Mining calls cost money: print the OpenRouter charge.
- Data provenance: TASTE (Zhu et al. 2026, arXiv:2605.20731), MIT-licensed; cite it in the generated file.
- Match surrounding code style: short comments explaining why, CRLF files stay CRLF.

## Review Focus

1. Nothing to plan (no words, subjects or pictures): `basePlan` returns zero items and the Worker skips the model call entirely.
2. Contact details mixed into copy (email, phone, address with digits) must be `contact`, priority 3 — never the headline.
3. A model answer that drops, duplicates or invents an item, or uses an unknown role → whole answer rejected, base plan used (tested in Task 4).
4. Restyle tasks keep the source's layout: the plan is still given, but marked `layout: "preserve"` so the Director does not reorder a locked composition (tested in Task 5).
5. Same content twice in one Worker isolate → second request reuses the cached plan (no second model call; tested in Task 4).

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/mine-taste-hierarchy.mjs` (create) | One-off: fetch TASTE briefs, extract reading order per brief with an LLM, aggregate, write the patterns file |
| `src/content/hierarchy-patterns.ts` (generated) | Reading-order priors per design kind, with provenance |
| `src/lib/plan/plan.ts` (create) | Types, `basePlan`, role heuristics, `checkPlan` |
| `src/lib/plan/plan.test.ts` (create) | Unit tests for the above |
| `worker/plan.ts` (create) | `planFor(env, state)`: model refinement, validation, fallback, memo |
| `worker/plan.test.ts` (create) | Worker tests with a faked fetch |
| `worker/env.ts`, `wrangler.jsonc` (modify) | `OPENROUTER_PLANNER_MODELS` |
| `worker/concepts.ts`, `worker/prompt.ts` (modify) | Pass the plan to Director and Artist; add plan usage to cost |

---

### Task 1: Mine reading-order patterns from TASTE

**Files:**
- Create: `scripts/mine-taste-hierarchy.mjs`
- Create (generated): `src/content/hierarchy-patterns.ts`
- Test: `src/lib/plan/plan.test.ts` (shape test only)

**Interfaces:**
- Produces: `export type Role = "brand" | "headline" | "subhead" | "hero" | "offer" | "body" | "cta" | "contact" | "detail"`, `export type DesignKind = "poster" | "flyer" | "social" | "advert" | "infographic" | "screen" | "magazine" | "thumbnail" | "other"`, and `export const HIERARCHY: Record<DesignKind, { briefs: number; order: Role[]; presence: Partial<Record<Role, number>> }>` from `src/content/hierarchy-patterns.ts`.

- [ ] **Step 1: Write the script.** Fetch rows from `https://datasets-server.huggingface.co/rows?dataset=purvanshi/TASTE&config=prompts&split=train&offset=N&length=100` until exhausted; de-duplicate on `prompt_id_src`. For batches of 20 briefs call OpenRouter (`google/gemini-3.5-flash-lite`, JSON schema output) with: "For each brief, give `kind` (one of the DesignKind values) and `order`: the content roles the design contains, in the order a viewer reads them, using only these roles: …". Aggregate per kind: `briefs` = count; `presence[role]` = share of briefs containing it (2 decimals); `order` = roles with presence ≥ 0.15 sorted by mean normalised position (index / (len − 1)). Kinds with < 5 briefs inherit `other`'s order. Write the TS file with a header citing TASTE and the run date, and print the total OpenRouter cost.

- [ ] **Step 2: Run it.** `node --env-file=.dev.vars scripts/mine-taste-hierarchy.mjs` — Expected: "mined 720 briefs … cost $0.0x" and the generated file.

- [ ] **Step 3: Shape test** in `src/lib/plan/plan.test.ts`:

```ts
it("has reading-order priors for every design kind", () => {
  for (const kind of DESIGN_KINDS) {
    expect(HIERARCHY[kind].order.length).toBeGreaterThan(1);
    expect(new Set(HIERARCHY[kind].order).size).toBe(HIERARCHY[kind].order.length);
  }
  expect(HIERARCHY.other.briefs).toBeGreaterThan(0);
});
```

- [ ] **Step 4: Run** `npx vitest run src/lib/plan` — PASS. **Commit:** `feat: reading-order priors mined from TASTE briefs`.

### Task 2: The rules-based plan

**Files:**
- Create: `src/lib/plan/plan.ts`
- Test: `src/lib/plan/plan.test.ts`

**Interfaces:**
- Consumes: `HIERARCHY`, `Role`, `DesignKind` (Task 1); `typedWords`, `textSources`, `subjectNames` (`src/lib/art/brief.ts`); `imageUse` (`src/lib/scene/describe.ts`).
- Produces:

```ts
export interface PlanItem { ref: string; kind: "words" | "subject" | "image"; role: Role; priority: 1 | 2 | 3; locked: string | null }
export interface ContentPlan { kind: DesignKind; message: string | null; layout: "free" | "preserve"; items: PlanItem[]; source: "rules" | "ai" }
export function basePlan(state: BuilderState): ContentPlan
export function roleOf(line: string): Role | null   // contact / cta / offer by pattern, else null
```

- [ ] **Step 1: Failing tests:**

```ts
it("orders the Seyon copy: brand, headline, then details, contact last", () => {
  const plan = basePlan(seyonState); // logo image (use logo) + 7 typed lines + subject "a cargo truck", format poster
  expect(plan.items.map((i) => i.role)).toEqual(expect.arrayContaining(["brand", "headline", "hero", "contact"]));
  expect(plan.items.find((i) => i.ref === "seyon_services@yahoo.com")).toMatchObject({ role: "contact", priority: 3, locked: "exact words" });
  expect(plan.items.find((i) => i.ref === "image 1")).toMatchObject({ role: "brand", locked: "reproduce exactly" });
  expect(plan.items.at(-1)!.role).toBe("contact");
});
it("spots contact, call-to-action and offer lines", () => {
  expect(roleOf("39A, Jalan Eko Botanik 3/4")).toBe("contact");
  expect(roleOf("+60 12-345 6789")).toBe("contact");
  expect(roleOf("Book now")).toBe("cta");
  expect(roleOf("20% off this week")).toBe("offer");
  expect(roleOf("TRANSPORTATION • LOGISTICS")).toBeNull();
});
it("is empty when there is nothing to plan, and marks restyles as preserve", () => { … });
it("leaves look-only pictures out: they are not content", () => { … });
```

- [ ] **Step 2: Run** — FAIL (module missing).
- [ ] **Step 3: Implement.** Items: every typed word line (`kind: "words"`, locked `"exact words"`, placed text adds `", placed position"`); each text-source picture as `"words from image N"`; subjects (`hero` for the first, `detail` after); pictures by use — logo→brand (`"reproduce exactly"`), product→hero (`"reproduce exactly"`), face→hero (`"keep likeness"`), look→omitted. Word roles: `roleOf` first, then first unassigned line → headline, second → subhead, rest → body. Priority: headline/hero 1; brand/subhead/offer/cta 2; body/contact/detail 3. Order: by the kind's `HIERARCHY.order` position, ties by input order. `kind` from `state.format` (`poster|flyer|magazine|thumbnail`) else `"other"`. `layout`: `"preserve"` for restyle with composition preserved, else `"free"`.
- [ ] **Step 4: Run** — PASS. **Commit:** `feat: rules-based content plan`.

### Task 3: Validating a model's plan

**Files:** Modify `src/lib/plan/plan.ts`; Test `src/lib/plan/plan.test.ts`

**Interfaces:** Produces `export function checkPlan(answer: { message: string; items: { ref: string; role: string; priority: number }[] }, base: ContentPlan): ContentPlan | null` — null when the answer drops, duplicates or invents an item, uses an unknown role or a priority outside 1–3; otherwise the answer's order/roles/priorities with **base locks and kinds**, `source: "ai"`, message trimmed to 160 chars.

- [ ] **Step 1: Failing tests** for each rejection and for locks being kept from base even when the answer omits them.
- [ ] **Step 2–4:** implement, run, PASS. **Commit:** `feat: validate the planner's answer against the base plan`.

### Task 4: The Planner in the Worker

**Files:** Create `worker/plan.ts`, `worker/plan.test.ts`; Modify `worker/env.ts`, `wrangler.jsonc`

**Interfaces:**
- Consumes: `basePlan`, `checkPlan`, `HIERARCHY`; `ask` (`worker/ai.ts`).
- Produces: `export async function planFor(env: Env, state: BuilderState, override?: string | null): Promise<{ plan: ContentPlan; usage: Usage | null; model: string | null }>`

- [ ] **Step 1: Failing tests** (fake fetch as in `worker/ai.test.ts`): a valid answer is used (`source: "ai"`); an invented item → base plan, no throw; a network error → base plan; an empty base plan → no fetch at all; the same state twice → one fetch.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.** System prompt: the Planner is a design strategist who decides *what* is said and in what order, never how it looks; input = base plan items (refs fixed), design kind, the kind's mined reading order and presence (as priors, not rules), the subject box, comments, style name. Output schema `{ message, items[] }`. `effort: "low"`, `maxTokens: 3000`, `models: env.OPENROUTER_PLANNER_MODELS || env.OPENROUTER_VISION_MODELS`. Memo: `Map` keyed by `JSON.stringify([base, subject, comments])`, capped at 200 entries (delete oldest).
- [ ] **Step 4: Run** — PASS. **Commit:** `feat: planner refines the content plan with Flash-Lite`.

### Task 5: Director and Artist follow the plan

**Files:** Modify `worker/concepts.ts`, `worker/prompt.ts`; Tests in `worker/concepts.test.ts`, `worker/ai.test.ts`

- [ ] **Step 1: Failing tests:** `conceptFacts(state, [], plan)` includes `plan`; the Director's system text names the plan; `perfectPrompt` passes the plan in its model input and adds planner usage to the returned usage; a restyle plan carries `layout: "preserve"`.
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement.** `concepts()` and `perfectPrompt()` call `planFor` first (the memo makes the second call free). Director rule: "plan lists the content in reading order with priorities and locks: build the hierarchy from it (priority 1 reads first and largest), keep every lock, and decide only how it looks; when layout is preserve, do not reorder." Artist rules (SYSTEM and DIRECTOR): "follow plan's reading order when placing and sizing content; never print the plan's message or roles."
- [ ] **Step 4: Run all tests and both typechecks** — PASS. **Commit:** `feat: director and writer follow the content plan`.

### Task 6: Live check

- [ ] Run the Seyon brief and two others (a café promo poster with an offer and CTA; a type-only event poster) through the real chain: planner → director → artist. Record per-step model, cost and time, and whether the director's hierarchy matches the plan. Report the results; no code change unless a defect appears.

### Task 7 (optional, needs approval for spend): TASTE scorer check

- [ ] Generate images for 5 briefs from prompts with and without the plan (same image model, Nano Banana 2 via OpenRouter, about $1), download the TASTE scorer checkpoint and its 2B backbone to D: (`HF_HOME` on D:, about 5 GB), score each pair on CPU, and report per-dimension preference. Kept outside the app (scratchpad), since it needs Python, PyTorch and a large model.

---

## Status (2026-10-09)

Tasks 1–6 built, verified and committed (31cbe4d).

Changes from the plan, found while building:
- **Mining:** batches of 10 (Flash-Lite truncated larger JSON answers); a batch failing 3 times is left out and counted. Result: 718 of 720 briefs labelled for $0.15.
- **Planner model is opt-in by setting:** without `OPENROUTER_PLANNER_MODELS` the rules plan is used and no call is made (keeps existing call-count tests exact; production sets it).
- **Dates and times:** a mostly-date line ("Sat 14 Nov, 8pm") is a `detail`; the live check showed both the rules and the model making the date the headline of an event poster, and the director then designing around it.
- **One retry** before falling back: Flash-Lite had transient provider errors in the live check; the reason is logged with `console.warn`.
- **Pictures with no role** are content too (`detail`, "include as it is"); look-only pictures are left out.

Live check (real chain, three briefs): planner ≈ $0.0005–0.0008 and 1–2 s; director (Sonnet 5.5) $0.033–0.038 and 12–15 s; artist (Kimi K3) $0.013–0.026 and 7–33 s; about 5–7¢ and under a minute per prompt with design ideas.

Task 7 prep (2026-10-09): the first A/B prompt run showed the planner adding little and sometimes hurting. Flash-Lite kept the rules' roles it was given (so the first typed line stayed the headline), missed brand names and mastheads, and garbled "·" when copying lines back, which got the whole answer rejected. Fixes: the model now answers by item number and gets no starting roles; the rules spot business names (brand, priority 1 when the rest is lists), issue lines (detail), and lists of services or classes (never the headline when a short display line exists). Re-run: all five plans from the model, with the right headlines. The blind A/B prompts are in output/task7/prompts.md (key.json holds the answer key). The user renders the images in GPT, then they get scored.
