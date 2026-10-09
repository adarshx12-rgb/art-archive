# Gold prompts: taste from the inspiration folder

Agreed in session on 2026-10-09.

## Goal

The site should turn what a visitor puts on the preview screen (typed and placed text, subjects, added pictures, comments, style, palette, format) into a prompt that produces work at the level of the images in `inspiration/`: something only a professional graphic designer would make. The visitor has no design knowledge; the taste must come from the site.

"Great taste" is defined by the user as the images in `inspiration/`. Success is measured on rendered images, not on prompt checks (see Measuring).

## Why the current design memory is not enough

`worker/data/design-memory.json` holds a text study per inspiration image (composition, hierarchy, typography, palette, lessons). The director and artist receive up to three studies per request. Studies *describe* an image in abstract terms ("asymmetric balance, generous negative space"), which fit every good poster, so the models fill them in with their own average idea of design. A model imitates a concrete worked example far better than it applies abstract lessons.

## Approach

For every good inspiration image, write the **gold prompt**: the prompt that would recreate it in the user's image model (GPT image), in a fixed structure and register, with its own words replaced by role placeholders. At request time, retrieve the closest gold prompts and have the director and artist adapt them to the visitor's content.

Approach B (sending the reference images to the director at request time) is deferred: higher cost per request and third-party images sent on every call. Revisit for single styles only if this approach falls short.

## 1. Making gold prompts (offline)

A new script, `scripts/gold-prompts.mjs`, runs after `study-inspiration.mjs` and uses its inventory and cache.

For each studied image (deduplicated by image hash, as now), a vision model (default `google/gemini-3.8-flash`, overridable with `--model`) receives the resized image and its existing study, and returns, as structured output (`worker/gold-schema.ts`, zod):

- `quality`: `strong | ok | weak`, with `qualityReason`. Weak, AI-looking, watermarked or misspelt references are marked weak.
- `prompt`: the recreating prompt, 600–1,600 characters, in this order: format and aspect; ground and palette (colour names with approximate hex and share); hero and its treatment, scale and crop; layout, device and reading order; lettering (letterform, scale, placement per item); finish; one `Avoid:` line.
- Placeholders replace every word visible in the image: `[BRAND]`, `[HEADLINE]`, `[SUBHEAD]`, `[OFFER]`, `[CTA]`, `[CONTACT]`, `[DATE]`, `[DETAIL]`, `[BODY]`, numbered when repeated (`[DETAIL 2]`). No transcribed slogans, names or brands; subjects are described by category.
- Retrieval labels: `kind` (the `DesignKind` values from `src/content/hierarchy-patterns.ts`), `roles` (the content roles present, from the planner's `ROLES`), `textLoad` (`none | light | heavy`), plus the study's existing `medium`, `structure` and `density`.

Rules:
- Only `strong` and `ok` gold prompts are compiled. `inspiration/gold-exclude.txt` (one image path per line, optional) lets the user exclude any reference by hand.
- Results cache in `inspiration/.study/<hash>.gold-v1.json`; only new or changed images are processed. Failed images are reported and do not block compiling the rest.
- Compiled to `worker/data/gold-prompts.json` (Worker only, never the browser bundle), keyed by the same reference `id` as design memory.
- The script prints the OpenRouter cost. Expected about $1–2 for the current ~130 images.
- `--limit N` for trials. **The first run is a 5-image trial reviewed by the user before the full batch.**

## 2. Using gold prompts at request time

### Retrieval

`retrieveGold(state, plan)` in `worker/gold.ts` ranks gold prompts, reusing design memory's style and term scoring and adding:
- design kind match with the plan's `kind`;
- role overlap between the plan's items and the gold prompt's `roles` (an offer + CTA brief prefers references that handle an offer and a CTA);
- `textLoad` against the number of plan words;
- `medium` and `density` against the design intent.

It returns up to three, each from a different reference, with `transfer`: `within-style` (same style folder) or `structure-only` (another style; its palette, finish and letterforms are stripped from the text given to the models, keeping layout, hierarchy and device). With no gold prompt above the score floor, it returns none and the chain behaves exactly as today.

### Director (concepts)

The director's input gains `goldPrompts: [{ ref: "G1", transfer, prompt }]`. Rules added to its system text:
- In `distinct` mode (default), each concept adapts a **different** gold prompt; with fewer gold prompts than concepts, the remainder are free.
- In `single` mode, all concepts riff on G1, varying device, crop and type treatment.
- Each concept states what it takes, in a new `BriefSchema` field `reference: { ref: string, takes: string } | null` (e.g. `{ ref: "G2", takes: "the arched masthead and stacked info block" }`).
- The visitor's content, palette and locks win over the reference; a `structure-only` reference lends layout and hierarchy only.

The mode is the Worker setting `GOLD_CONCEPT_MODE = "distinct" | "single"` in `wrangler.jsonc`, so the fallback can be tested without code changes.

### Artist (final prompt)

When the picked concept has a `reference`, the artist receives that gold prompt and writes the final prompt in its structure, register and decision density, filling its placeholders with the plan's items in the plan's reading order. Without a reference, today's behaviour.

### Checks (added to the existing repair pass)

- No leftover placeholder (`/\[[A-Z]+(?: \d+)?\]/`) in the final prompt.
- When the visitor chose colours, none of the reference's own colour names or hex codes outside the `Avoid:` line.
- Not a copy: the final prompt shares no run of 12 or more consecutive words with its gold prompt, outside the fixed structure words.

Any failure feeds the existing single repair pass, as missing items do now.

### Unchanged

Planner, locks, palette resolution and recolouring, the "no invented words" check, restyle rules, and the design-memory study text, which stays as fallback context for references without a gold prompt. Gold prompts replace the study text for the same reference in the request context (about 1,200 characters against about 4,000), within the existing 14,000-character cap.

## Measuring

A harness in the scratchpad (like Task 7) runs about 8 briefs across the best-stocked styles (grunge, concert-poster, retro, streetwear-poster, film-still-poster, gothic, pop-art, acid), each with realistic preview-screen inputs: typed copy, a subject, a comment, some with an added picture. For each brief: one final prompt from the current chain and one with gold prompts, from the same concept slot, shuffled into blind A/B with a key file.

The user renders them in GPT. Judged three ways:
1. the user's blind preference (the deciding vote);
2. the TASTE scorer on each pair;
3. a vision model comparing each image with the reference it adapted: does it reach that level?

**Win:** gold prompts preferred on at least 6 of 8 in the user's blind picks and not worse on the TASTE scorer. **If not:** rerun the same briefs with `GOLD_CONCEPT_MODE=single` and compare. Styles that keep losing are listed for more or better inspiration.

Text-model cost per run about $1; the user renders images (no paid image generation by Claude).

## Risks

| Risk | Guard |
|---|---|
| Output copies one reference | Placeholders only, never the original words; content and palette from the visitor; the 12-word copy check |
| Weak references teach bad habits | Quality gate; `gold-exclude.txt` |
| Styles with no references get worse | No gold prompt → today's chain, unchanged |
| The vision model misreads an image | The 5-image trial reviewed by the user before the full batch |
| Third-party images | Only text is compiled into the app; images stay in the ignored folder, sent to the provider once at study time as today |

## Testing

Unit tests (vitest):
- gold schema: valid and invalid answers, placeholder format, no lowercase transcription leaks in a fixture;
- compile: weak and excluded references left out, deduplication, Worker-only import;
- retrieval: kind and role overlap ranking, three distinct references, `structure-only` stripping, none below the floor;
- director: `distinct` and `single` modes in the system text and input; `reference` validated against the supplied refs;
- artist: gold prompt passed only with a referenced concept;
- checks: leftover placeholder, reference colours with custom palette, 12-word copy;
- fallback: no gold prompts gives the same model input as today;
- context stays under the cap.

Plus both typechecks and the production build.
