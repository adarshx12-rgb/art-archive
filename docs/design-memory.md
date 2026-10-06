# Design memory

The model now receives relevant observations from the artwork in `inspiration/` when it proposes concepts, writes prompts, suggests palettes or advises on a template. This is persistent reference retrieval, not model-weight training. The underlying models are unchanged.

The initial study covers **235 files, 130 distinct images, across 24 populated folders**. Identical decoded pictures are studied once and retain every folder association. The 23 empty folders are reported as empty; the system does not claim to have studied them. Every record retains its source path, file hash, dimensions, study model and study date.

## What it learns

Each image is visually inspected at up to 1200 pixels on its longest side. The study records composition, hierarchy, typography, colour relationships, image treatment, finish, density and structure. Each reusable lesson includes the visible evidence, why the decision works, how to adapt it and when it fails. These are model observations; they can still be mistaken, especially for small details or inferred production methods.

The originals stay in the ignored `inspiration/` folder. During study, resized copies are sent to the project's OpenRouter account for vision analysis. Only the resulting text observations and provenance are compiled into `worker/data/design-memory.json`. The compiled memory is imported by the Worker, not the browser. The UI does not download the library or the source images.

## How it adapts

At request time, retrieval considers the selected style, subject, custom directions, density, medium and composition. It selects up to three distinct references and caps their combined context at 14,000 characters. Same-style references may inform treatment and colour relationships. References from other aesthetics are marked `structure-only`; their finishes, palette and letterforms are not supplied as suggestions.

The model's priorities are explicit:

1. Preserve the user's exact words, selected colours, geometry and restyle constraints.
2. Understand the kind of image: photograph, pattern, collage, quiet composition, type-led design or another structure.
3. Borrow an applicable design relationship, with its reason and limitations.
4. Remove arbitrary extras and inappropriate surface effects before returning the result.

Equal-scale repeating words no longer imply a giant title above tiny wallpaper. A photograph need not become a printed poster. Dense work is allowed to stay dense. Barcodes, registration marks, tape, grain and borders are optional choices, not default signs of design quality. Smooth lettering, unprocessed photography and uniform repetition have explicit entries in the craft vocabulary.

Concept and prompt API responses include `designSources` with reference IDs, folder associations and transfer mode, so an output can be traced to the evidence supplied. These identify supplied context, not proof that the model used every reference correctly. Explicit smooth-lettering and no-texture requests filter incompatible craft choices, and colour-preserving restyles reject clear recolouring contradictions. A tightly constrained brief can return fewer than three concepts.

## Updating the collection

Requires the existing Node environment and Python with Pillow. Add or replace images in `inspiration/<style>/`, then run:

```sh
npm run inspiration:refresh
npm run inspiration:check
npm test
npm run build
```

Refresh inventories current files, creates local contact sheets, and studies only images without a valid cached result. It uses `OPENROUTER_API_KEY` from the environment or `.dev.vars`; the key is never written to the report. The default study model is `google/gemini-3.8-flash`, checked against the provider's advertised image-input capability before use. Set `INSPIRATION_MODEL` to use another compatible model for new studies.

Studies and audit thumbnails are cached in `inspiration/.study/`. Completed work survives interruptions. Failed or missing studies prevent replacement of the runtime memory; rerun to finish. Increment the study version when changing the extraction schema or instructions in a way that requires restudying the collection. A changed model setting alone does not invalidate successful cached studies.

For a small trial, run `python scripts/prepare-inspiration.py`, then `node scripts/study-inspiration.mjs --limit 2`. Partial trials populate the cache but do not replace a complete runtime memory. `node scripts/study-inspiration.mjs --compile-only` rebuilds from completed cached studies without calling a model. `inspiration:check` is read-only and checks current source hashes, so stale files are detected.

Vision calls use [OpenRouter image inputs](https://openrouter.ai/blog/tutorials/send-image-to-llm/) and [structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs). Studying new images incurs normal provider charges; retrieval at runtime requires no additional service or embeddings API.

## Verification

Unit tests cover collection completeness, schema validity, deduplication, style relevance, custom briefs, repetition, forbidden directions, empty matches, restyle constraints, wordless work and bounded context. Browser and real-model checks are separate from those deterministic tests.

`node scripts/eval-design-memory.mjs baseline` and `npm run eval:design` collect real concepts and final prompts for contrasting briefs. Reports are local to `output/design-memory/`; successful cases are resumed rather than billed again. Delete or rename a report before deliberately rerunning all of its cases. The image-study coverage is measurable; excellent taste still requires reviewing the generated images, not merely counting passing prompt checks.

Use `node scripts/eval-design-memory.mjs after --rerun=restyle,equal-diagonal-type` to repeat only selected cases. Capture a baseline before making a change; running the baseline command afterwards does not reproduce an older implementation. See [the initial evaluation](design-memory-evaluation.md) for observed results and limits.
