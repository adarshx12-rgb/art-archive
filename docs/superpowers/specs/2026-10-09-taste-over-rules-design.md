# Taste over rules: concepts a high-paid designer would make

Agreed in session on 2026-10-09.

## Goal

Design ideas should look like what a high-paid graphic designer would deliver for the same brief: rich, layered compositions with depth, a supporting system of details, energy and texture, and one clear focal point. The director should work from what it has learned (references, gold prompts, style briefs) and its own taste, not from one fixed set of design rules applied to every brief.

The guiding idea, in the user's words: treat the models like children. A child learns by looking at good art, understanding it and trying it out; feeding the models good reference images is key to better prompts and better taste.

The user's words on the sneaker test: the sneaker concepts were "very generic, not much creativity"; the composition "could have been better with more elements"; creative means "what a high paying graphic designer would make" and "not sticking to one design rule" but operating "on own based on what the model learnt and taste".

## Why the current chain falls short

In the A/B test of 2026-10-09 (planner + gold prompts against the old chain) the director landed on the same obvious idea for each brief whether or not it had references, and most pairs tied. Rules at three levels push every brief through the same funnel:

- the director's system text: a fixed 7-step method, "at most three" extras, "use at least one technique from the craft list", "restraint", "zero extras is often right", "remove arbitrary decorative extras";
- code checks in `checkBrief` (`src/lib/art/brief.ts`): more than 3 furniture items, or no craft technique/device, rejects a concept;
- the artist's system text (`worker/prompt.ts`): 110–200 words, too short to describe a rich, layered design.

## Approach

Learn the way a child does: look at good art, understand it, try, get feedback, practise.

- **Look:** the director and the critic see the actual images of the closest references for each brief, not only text about them (section 2).
- **Understand:** each image comes with its study and gold prompt, and the director writes what makes each one work before it sketches (section 2).
- **Try freely:** the rulebook is replaced by a creative standard, and the director sketches widely before choosing (section 1).
- **Feedback:** an art-director critique compares the concepts with the reference images and improves them (section 3).
- **Practise:** a repeatable offline round recreates references, the user renders them, and a vision model records what was missed, feeding the gold prompts (section 4).

A stronger director model (option C) is deferred.

## 1. Taste over rules

### Kept as hard promises (code checks, unchanged)

- Quote only the visitor's own words; never invent words, dates or captions.
- The hero is one of the visitor's subjects (or lettering or a pure shape when there are none).
- The selected palette, locked layouts, restyle limits and placed-text geometry are kept.
- Supporting elements (the `furniture` field) carry no words of their own.
- Brief/concept schema validity and the existing fidelity checks.

### Removed

- `checkBrief`: the "at most 3 furniture items" rule and the "use at least one technique or device from the craft list" rule. Unknown craft ids are still rejected; craft stays optional vocabulary.
- `checkSet` stays (it only compares craft ids; concepts without craft pass).
- Director system text: the numbered 7-step method, the 3-extras limit, the forced craft rule.
- `DESIGN_JUDGMENT` (`worker/design-memory.ts`): the restraint bullet ("Do not append barcodes… Zero extras is often right") and "arbitrary decorative extras … Remove these" in the final self-check.

### Added

- A creative standard at the top of the director's system text:

  > You are the designer a brand pays well. Deliver what a top studio would for this brief: a rich, layered composition with depth (elements in front of and behind each other), a supporting system of details that rewards a second look, energy and texture, and one clear focal point that reads first. Every element earns its place; cut only what has no job. Use what you have learned from the references, gold prompts and style notes, and your own taste; there is no house style and no checklist. Minimal styles stay minimal when the style and its references call for it.

- `DESIGN_JUDGMENT` restraint bullet becomes "richness with purpose": add what a senior designer would add; every element has a compositional job; dense is welcome when organised around one focal point.
- Wide, then narrow: `ConceptsOut` gains `sketches: string[]` (about 8 one-line rough ideas, each a different idea, not variations). The director writes them first, then develops the three strongest and most different into concepts. Sketches are returned by `/api/concepts` for inspection; the UI does not need to show them.
- `BriefSchema.furniture` is redescribed as the supporting system: wordless elements (or ones holding the visitor's quoted words), each placed, as many as the design needs.

### Artist

- Word guidance becomes about 180–320 words (both `SYSTEM` and `DIRECTOR` texts in `worker/prompt.ts`).
- The artist places every supporting element from the concept; the "omit if unnecessary" wording for extras goes.
- The learn-not-copy rule for gold prompts stays.

## 2. Look and understand: reference images at request time

### Storage

- A private Cloudflare R2 bucket `inspiration-refs`, bound to the Worker as `REFS` (`wrangler.jsonc` `r2_buckets`). It is never public and never served to the browser.
- Contents: one JPEG per usable reference (gold prompt compiled), keyed by the reference `id` (`<id>.jpg`), resized to at most 768 px on the long side, quality about 80 (roughly 40–80 KB each; about 15 MB for the current 215).
- `scripts/upload-refs.mjs` uploads missing or changed thumbnails with `wrangler r2 object put` (local and remote), from `inspiration/.study/<hash>.jpg` thumbnails resized with Pillow via `scripts/prepare-inspiration.py` output or a small resize step. It runs after `gold-prompts.mjs`. A manifest of uploaded ids and hashes avoids re-uploading.
- Locally (`npm run dev`) the bucket is the Wrangler local R2 store, filled by the same script with `--local`.

### Use

- `worker/refs.ts`: `referenceImages(env, ids): Promise<string[]>` fetches the images from `REFS` as data URLs (`data:image/jpeg;base64,…`), in order, skipping any missing object; at most 3; a missing binding or any error returns `[]` (the chain then works from text, as today).
- Director: the picked gold references (up to 3) are sent as images with the request, in the same order as `goldPrompts` (G1, G2, G3), using `ask`'s existing `images` option. The director's text says: "The images are the references G1–G3. Study them: what makes each work. Then make something new for this brief at that level; never copy one."
- Understand step: `ConceptsOut` gains `observations: { ref: string; works: string }[]`: one line per reference on what makes it work (composition, layering, type, colour, detail), written before `sketches`.
- Structure-only references are sent as images too; the text still says to borrow only their structure.
- Models: the director chain must accept images. `OPENROUTER_DIRECTOR_MODELS` (Sonnet 5.5, Kimi K3) both do; the Anthropic last resort does too. If the provider rejects images, the call is retried once without them.
- Cost: about half a cent per image per call; about 3 cents more per set of ideas with the critique.
- Privacy: the user agreed (2026-10-09) to store the thumbnails in private R2 and to send 2–3 of them to the model provider per ideas request.

## 3. Art-director critique

After the director's concepts pass the code checks, one more call reviews and improves them.

- Models: `OPENROUTER_DIRECTOR_MODELS` (Sonnet 5.5, then Kimi K3), same chain as the director.
- Role: "You are the creative director at a top studio reviewing your designer's three concepts before they go to the client."
- Input: the same facts the director had (including plan, gold prompts, design memory, style notes), the same reference images, plus the kept concepts. Its first question for each concept: set beside the reference images, does it reach that level, and if not, what is missing?
- Output schema `CritiqueOut`: `{ notes: { title: string; generic: string; push: string; cut: string }[]; concepts: Brief[] }`: per concept what is generic or weak, what a top studio would add or push, what is clutter; then the improved concepts, strongest first.
- The improved concepts go through `sortBriefs` (all hard checks). If the call fails, returns no valid concepts, or drops below the number kept before, the original concepts are used. A critique can never make the result worse than skipping it.
- `/api/concepts` returns `critique: notes[] | null` and the usage includes the critique call.
- Setting `CONCEPT_CRITIQUE`: `"on"` (default) or `"off"`, in `wrangler.jsonc` and `Env`.
- Cost: about 3–4 cents more per set of ideas; latency about 10–20 seconds more.

## 4. Practice rounds (offline, repeatable)

The trying-out loop, done over time, extending the gold trial of 2026-10-09.

- `scripts/practice.mjs pick --n 6` chooses references (rotating through styles, least-practised first) and writes `output/practice/<date>/sheet.md`: each reference's gold prompt with placeholders shown as role names, and the file name to render (`practice-<id>.png`).
- The user renders them (Claude never generates images).
- `scripts/practice.mjs review <date>` sends each render and its original to a vision model, which returns: a similarity verdict, what the prompt missed (`missed: string[]`), and a corrected gold prompt. The review is written to `output/practice/<date>/review.md` and each corrected gold prompt to the gold cache (`<hash>.gold-v1.json`, keeping the previous one as `<hash>.gold-v1.prev.json`); then gold prompts recompile.
- Recurring misses across rounds (e.g. "colour mode", "vertical type orientation") are added to the gold-prompt instructions, as was done by hand after the trial.
- Cost: about 1 cent per reviewed pair; the user's rendering time is the real cost, so rounds are small and occasional.

## 5. Comparison test

- Same 8 briefs and inputs as `output/abtest/briefs.json`.
- Then: the chain on `main` before this work (planner, gold prompts `distinct`, current rules). Now: this work with the critique on.
- Concept slot 1 from each arm (the critic orders strongest first). 16 renders by the user.
- Blind A/B sheet with shuffled A/B and `key.json`, plus, per "now" brief, the director's sketches and the critique notes.
- Before handing over: read every "now" prompt for clutter, broken promises and invented words.
- Win: "now" preferred on at least 5 of 8 in the user's blind picks, and the winners not called generic. If not: review sketches and critique notes with the user before changing anything.
- Cost about $1 in text calls.

## Risks

| Risk | Guard |
|---|---|
| Richer becomes clutter | The standard demands one focal point and a job for every element; the critic names clutter; the user's blind picks judge it |
| Freedom breaks visitor promises | All promise checks stay in code; critique output is re-checked and falls back on failure |
| Longer prompts drop details | Existing missing-item checks and the repair pass are unchanged |
| Cost and latency | Critique adds one call; `CONCEPT_CRITIQUE=off` disables it |
| Images leak publicly | R2 bucket is private, read only through the Worker binding; never in `public/` or the browser bundle |
| Images unavailable (local dev, missing object) | `referenceImages` returns `[]`; the chain works from text |
| The director copies what it sees | The learn-not-copy rule, the 8-word copy check, and the critique's "never copy one" question |

## Testing

Unit tests (vitest):
- `checkBrief` accepts a concept with 6 furniture items and none from the craft list; still rejects unknown craft ids, invented words, a wrong hero and worded furniture.
- Director system text contains the creative standard and no longer contains the 7-step method, "at most three" or "Zero extras".
- `ConceptsOut` carries `sketches`; `/api/concepts` returns them.
- Critique: with `CONCEPT_CRITIQUE` on, a second call is made with the concepts in its input and the improved concepts are returned with notes; with it off, no second call; a critique that invents words or fails falls back to the originals; usage adds both calls.
- Artist system texts carry the new word range and the "place every supporting element" rule.
- `referenceImages`: returns data URLs in order from a fake R2 binding; skips missing objects; returns `[]` without a binding or on error.
- Director call carries the images (`images` option) in G1–G3 order when gold references are picked, and none when there are none; `observations` are returned.
- A provider rejection of images retries once without them.
- `practice.mjs`: picking rotates styles and skips recently practised references; review writes the corrected gold prompt and keeps the previous one (tested with a fake model response).

Plus both typechecks and the production build.
