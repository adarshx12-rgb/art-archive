# Initial design-memory evaluation

Run on 2026-10-06 against the local Worker. These are prompt/concept checks, not rendered-image quality scores or a statistical proof of improved taste.

## Collection

- All 235 current source files reconcile against their recorded SHA-256 hashes.
- 130 distinct decoded images have validated visual studies; duplicates retain all source associations.
- All 24 populated folders are covered. The 23 empty folders are explicitly reported.
- The stored successful image-study responses report approximately $0.64 in OpenRouter usage. This excludes concept/prompt evaluation calls and is not a full billing reconciliation.
- The study catalogue is present in the Worker bundle and absent from the browser bundles.

## Live generation checks

All six final cases returned concepts and a final prompt with zero fidelity warnings. The serving model was `moonshotai/kimi-k3` for both concepts and prompts.

| Brief | Final concepts | Observed behaviour |
| --- | ---: | --- |
| Swiss cat poster, no lettering | 3 | Used column alignment, asymmetric balance and window framing; no invented lettering. |
| Grunge boxer, “Last Round” | 3 | Preserved the exact phrase and limited palette; fewer stock decorative extras. |
| Art Deco perfume bottle, two colours | 3 | Adapted stepped symmetry and radial organisation to the bottle using the selected palette. |
| Quiet custom product photograph, no texture | 3 | All three used natural photography, no furniture and no print texture. |
| Pop Art restyle, preserve composition and colours | 2 | Used existing darkest/lightest tones and source hues instead of specifying new paper or ink colours. |
| Equal-size diagonal “what the chat” wallpaper | 1 | Kept 19 placed text elements, exact geometry, smooth lettering, green/black palette and no separate headline. |

Two retained baseline/after pairs permit a direct comparison: the Swiss and grunge cases. Each baseline set contained six furniture items across three concepts. Each final set contained two. The baseline Swiss set added registration marks, a keyline, a pill badge, grid lines and a barcode; the final set was more selective. This is evidence of reduced automatic decoration in these samples, not a universal quality metric.

Live checks also found defects during implementation: alternative wallpaper concepts introduced halftone and carved lettering despite the smooth-type request, and a colour-preserving restyle introduced black ink and yellowed paper. The final implementation filters conflicting craft and checks clear recolouring contradictions. The affected cases were regenerated and inspected after those corrections.

## Deterministic checks

443 unit tests pass, including coverage, study-schema validity, retrieval relevance, deduplication, custom-style transfer, explicit negations, repetition, context limits and rendering constraints. Type checking and the production build pass. A headless browser check verifies the 19-element board's URL round-trip, rendered prompt and absence of page errors.

The checks are intentionally distinct: passing schemas and constraint checks does not establish aesthetic excellence. The collection's observations are machine-generated and may misread details or infer a production process incorrectly. Future evaluation should include actual generated artwork and the user's preference judgments across more briefs.
