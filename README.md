# FORM / FIELD

A visual library for discovering styles, exploring 2–4 colour palettes and composing detailed image and video prompts.

It is a **prompt-writing and reference tool**. It does not generate images or video, call any AI API, or need a backend. Everything runs in the browser from local content; saved items live in `localStorage`.

## Run it locally

Requires Node 22.22+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload (site and `/api` Worker) |
| `npm run typecheck` | TypeScript check for the site and the Worker |
| `npm test` | Unit tests (Vitest) — prompt composition, URL state, filters, storage, content integrity |
| `npm run build` | Type check + production build to `dist/` (`client/` site, `form_field/` Worker) |
| `npm run preview` | Serve the production build at http://localhost:4173 |
| `npm run e2e` | Browser acceptance checks against `npm run preview` (see below) |
| `npm run eval:ai` | Scores the AI endpoints on fixed test cases (calls the model; costs money) |
| `npm run deploy` | Build and deploy to Cloudflare |

`npm run e2e` drives your **installed Chrome** through `playwright-core` (no browser download). Start `npm run preview` in another terminal first. If Chrome isn’t at the default Windows path, set `CHROME_PATH`; use `BASE` to target another URL.

## AI features and deployment

The site runs on one Cloudflare Worker (`wrangler.jsonc`): Cloudflare serves the built files directly, and only `/api/*` reaches the Worker code in `worker/`.

| Endpoint | Does | Effort |
| --- | --- | --- |
| `POST /api/scene` | Text or an instruction → 3D scene (subjects, poses, facing, camera, light) | medium |
| `POST /api/palette` | Mood → 2–4 named colours in role order, contrast-checked | low |
| `POST /api/prompt` | Builder settings → polished prompt; code checks every subject, colour, the style and lens made it in, with one repair pass | high |

- **Model:** `AI_MODEL` in `wrangler.jsonc` (default `claude-sonnet-5`). All provider code is in `worker/ai.ts`; replies are validated against Zod schemas before use.
- **Key:** `ANTHROPIC_API_KEY` is a secret, never in the code. Locally, copy `.dev.vars.example` to `.dev.vars` and fill it in (git ignores it). In production: `npx wrangler secret put ANTHROPIC_API_KEY`.
- **Protection:** same-origin requests only, 32 KB request cap, 12 AI calls a minute per visitor (`ratelimits` in `wrangler.jsonc`). Also set a monthly spend limit in the Anthropic Console.
- **Deploy:** `npx wrangler login` once, then `npm run deploy`.

## Routes

| Route | Page |
| --- | --- |
| `/` | Homepage: hero collage, featured aesthetics, palettes, how it works |
| `/styles` | Searchable, filterable gallery — state lives in the URL (`?q=&kind=&colour=&form=&density=&sort=`) |
| `/styles/:slug` | Style page: ingredients, references, image / video / restyle prompts, palettes, related styles |
| `/palettes` | Palette gallery, filter by exactly 2 / 3 / 4 colours (`?n=`) and search (`?q=`) |
| `/palettes/:slug` | Palette page: hex copy, roles, proportions, compatible aesthetics |
| `/builder` | Prompt builder — the URL is always a share link for the current settings |
| `/saved` | Saved styles and palettes |
| `/credits` | Image credits, licences and the missing-reference list |

Unknown slugs and routes show recovery screens with suggestions. Invalid builder links restore what they can and list what was ignored.

## Project structure

```
src/
  config/site.ts            product name and storage key — rename the product here
  content/                  all catalogue content (no UI code)
    types.ts                typed records: StyleRecord, PaletteRecord, ReferenceImage…
    styles/*.ts             63 styles, split into themed files; index.ts combines them
    palettes.ts             24 curated palettes (8 × 2, 8 × 3, 8 × 4 colours)
    references.ts           licensed reference images with provenance
    facets.ts               filter labels
  art/
    studies/*.tsx           one original SVG study renderer per style
    StyleArt.tsx            lazy-mounted, recolourable study with an “Illustrative study” label
    PaletteArt.tsx          strict limited-colour palette compositions
    ReferenceFigure.tsx     reference image with credit, licence and source link
  lib/
    prompt/                 prompt composition — pure, deterministic, unit-tested
      options.ts            builder vocabularies (label + exact phrase)
      state.ts              builder state, defaults, URL encode/decode + validation
      compose.ts            composePrompt(), palette roles, restyle template
    catalogue.ts            search, filters, sorting, relations, suggestions
    color.ts                hex parsing, contrast, plain-language colour names
    storage.ts              defensive localStorage read/write
    clipboard.ts            copy with fallback, .txt download
  state/                    React providers: saved items, toasts
  components/, pages/       UI
public/refs/                optimised reference images (WebP)
scripts/e2e.mjs             browser acceptance checks
```

## Adding styles

The catalogue is your 63-style list; see “Content notes” below for how duplicates were handled. To add or edit a style:

1. Append a `defineStyle({...})` entry to the most fitting file in `src/content/styles/`, or create a new file and add it to `styles/index.ts`.
2. Fill every field with **observable** traits rather than history. The prompt builder assembles prompts from them:
   - `summary`: one sentence for cards. `about`: 2–4 sentences.
   - `kind`: `movement` | `period` | `aesthetic` | `technique` | `interface`. Don’t call an aesthetic a movement.
   - `aliases`: alternative names and spellings. Search uses them.
   - `note`: optional caveat, e.g. “Internet-era label; definitions vary.”
   - `swatches`: exactly 4 `{ hex, name }`, dominant first. Names are used in prompts, so make them descriptive (“oxidised copper”).
   - `look`: colour, texture, materials, lighting, composition, typography, each written as a prompt-ready phrase.
   - `prompt.cues`: at least 5 concrete visual cues, most characteristic first. Subtle intensity uses 2, balanced 4, strong all.
   - `prompt.motion`: how the look moves, used in video prompts. `prompt.avoid`: things that pull away from it.
   - `colourFacets`, `formFacets`, `density`: drive the gallery filters.
   - `related`: other style slugs. `references`: IDs from `references.ts`. `featured`: optional rank.
3. Add artwork (next section).
4. Run `npm test`. The content tests check unique slugs, 4 valid swatches, at least 5 cues, that every `related` / `references` / palette `suits` link resolves, that each style has a renderer, and that summaries and first cues are distinct.

The test `has 63 styles` pins the current count, so update it when you add entries.

## Quotes

The homepage fills layout gaps in the featured grid with quotations from `src/content/quotes.ts`, rotating daily. Only lines traceable to a named published source are included (Klee, Kandinsky, Albers, O’Keeffe, Sullivan, and Degas as recorded by Valéry), each shown with its source and year; translations are marked. Add new quotes only with a verifiable source.

## Adding palettes

Add a record to `src/content/palettes.ts`:

- Exactly 2, 3 or 4 colours, in role order: `background, primary` / `background, primary, accent` / `background, primary, secondary, accent`.
- `share` values must total **100** (tests enforce this).
- `suits`: style slugs the palette is curated for. Styles also get “close colour match” palettes computed automatically, so every style shows four compatible palettes.
- `composition`: one of `fields | arch | stripes | orbit | steps | split | window | wave`, the layout of its reference composition.

## Adding artwork

There are two kinds, and the UI always labels which is which.

**Illustrative studies (every style).** Original SVG compositions in `src/art/studies/*.tsx`, keyed by style slug. A renderer receives the four colours and a unique ID prefix (for gradients and filters) and returns SVG for a 400×500 canvas:

```tsx
"my-style": ([ground, a, b, c], u) => (
  <>
    <rect width={W} height={H} fill={ground} />
    …
  </>
),
```

Draw only from the passed colours: the builder recolours studies live with the user’s palette. To reuse another style’s study, set `art: { kind: "study", renderer: "other-slug" }`. Studies are never labelled as historical examples.

**References (optional, licensed).** Photographs or scans with provenance:

1. Use only public-domain, CC0, CC BY or CC BY-SA works, and record them exactly as the source states. The existing ones came from Wikimedia Commons, with licence data read from each file page’s metadata.
2. Resize to ≤ 900 px wide and encode as WebP at about quality 74 (the existing files were made with `sharp`; 12–247 KB each). Save to `public/refs/<id>.webp`.
3. Add a `ReferenceImage` to `src/content/references.ts` with the real `width`/`height`, `alt`, a `caption` that says honestly what the image shows for the style, `creator`, `date`, `licence`, `licenceUrl` and `sourceUrl`.
4. Add the ID to the style’s `references`. It then appears on the style page and on `/credits`.

## Asset attribution

All 17 reference images come from Wikimedia Commons, resized and re-encoded, with no other changes.

| File | Work | Creator | Licence | Used for |
| --- | --- | --- | --- | --- |
| `schwitters-entrance-ticket.webp` | Entrance Ticket (Mz 456), 1922 | Kurt Schwitters | Public domain | Collage Art |
| `schwitters-strassenbahnbillet.webp` | Ohne Titel (Collage mit Straßenbahnbillet), 1927 | Kurt Schwitters | Public domain | Collage Art |
| `gottscho-chrysler-1932.webp` | Chrysler Building from the Empire State Building, 1932 | Samuel H. Gottscho | Public domain | Art Deco |
| `chrysler-lift-door.webp` | Lift door, Chrysler Building lobby (2011 photo) | Tony Hisgett | CC BY 2.0 | Art Deco |
| `gottscho-trylon-perisphere.webp` | Trylon and Perisphere, World’s Fair, c. 1939 | Samuel H. Gottscho (via The Met) | CC0 1.0 | Futuristic |
| `paul-amazing-stories-1928-08.webp` | Amazing Stories cover, Aug 1928 | Frank R. Paul | Public domain | Futuristic (labelled as a historical vision of the future) |
| `proulx-brass-spider.webp` | Steampunk clockwork spider (2009) | Daniel Proulx | CC BY 2.0 | Steampunk |
| `parseghian-steampunk-radio.webp` | Victorian-style steampunk radio (2018) | Abraham Parseghian | CC BY-SA 4.0 | Steampunk |
| `imac-g3-bondi.webp` | iMac G3 Bondi Blue, three-quarters view | Rama; alterations by David Fuchs | CC BY-SA 4.0 | Y2K |
| `moholy-nagy-komposition-6.webp` | Composition, sheet 6, 1923 | László Moholy-Nagy | Public domain | Bauhaus |
| `lissitzky-red-wedge.webp` | Beat the Whites with the Red Wedge, 1919 | El Lissitzky | Public domain | Constructivism |
| `mucha-job-1896.webp` | Job, 1896 | Alphonse Mucha | Public domain | Art Nouveau |
| `rousseau-the-dream.webp` | The Dream, 1910 | Henri Rousseau | Public domain | Naïve |
| `mondrian-composition-ii-1930.webp` | Composition II in Red, Blue, and Yellow, 1930 | Piet Mondrian | Public domain | Modernism |
| `cologne-cathedral-interior.webp` | Interior view of Cologne Cathedral (2026 photo) | Kaap bij Sneeuw | CC0 1.0 | Gothic |
| `huffman-barbican.webp` | Barbican Estate (2007 photo) | Todd Huffman | CC BY 2.0 | Brutalism |
| `morris-strawberry-thief.webp` | Strawberry Thief, 1883 | William Morris | Public domain | Victorian Style |

Full source URLs are in `src/content/references.ts` and on the `/credits` page. CC BY-SA files keep that licence; the site shows attribution next to each image.

Fonts: Schibsted Grotesk and DM Mono, self-hosted via Fontsource (SIL Open Font License). Icons: Lucide (ISC).

## Missing references

These **50 styles** currently have only their illustrative study. Many are recent, digital or commercial aesthetics whose defining works are still under copyright:

70’s Retro, 80’s Editorial, Acid, Aurora, Blueprint, Bohemian, Bubbleglam, Chromecore, Clay Style, Cyberminimalism, Cyberpop, Cyberpunk, Deconstructivism, Editorial, Experimental Type, Future Funk, Gen X Soft Club, Glassmorphism, Glitch, Graffiti, Grunge, Handwritten, Italo Disco, Kidcore, Luxury Minimal, Maximalism, Memphis, Mid-Century Modern, Minimalism, Neubrutalism, Neumorphism, New Wave, Pixel Art, Pop Art, Post-Modernism, Psychedelic, Punk, Retro, Skeuomorphism, Surreal Design, Surveillance, Swiss / International Typographic Style, Synthwave, Tech Spec, Type Doodles, Vaporwave, Vector Art, Vector Minimalism, Web 1.0, Web 2.0 Gloss.

Good next candidates: public-domain Swiss or modernist posters, pre-1930 Victorian playbills and engravings, government technical drawings (Blueprint), and your own photographs or commissioned work for the digital aesthetics.

## Content notes

- **Your list has 65 lines and 63 unique styles.** *Cyberpunk* and *Maximalism* each appear twice and are included once. “Graffitti” is shown as **Graffiti**, with the original spelling kept as a searchable alias.
- **The first brief’s seed list** included *Retro Futurism*, which isn’t in your list, so it isn’t in the catalogue. It is one `defineStyle` entry away if you want it. The rest of that seed list (Swiss, Bauhaus, Art Deco, Y2K, Vaporwave and so on) is already in your list.
- **Kinds are classified**, not all “movements”: 15 movements, 6 period looks, 24 aesthetics, 12 techniques and 6 interface styles. Loosely defined internet-era labels (Gen X Soft Club, Bubbleglam, Chromecore, Cyberpop, Acid and others) carry a visible note that definitions vary.
- **Descriptions avoid firm historical claims**, using wording like “associated with…”, and focus on visible traits.

## Prompt composition

`composePrompt(state)` in `src/lib/prompt/compose.ts` is pure and deterministic. A prompt is built from labelled lines: subject and task; style cues, scaled by intensity; texture and materials; colour palette with roles, hex values and shares; composition and aspect; lighting; lettering (only when the subject implies text); camera, subject motion, style motion and duration for video; preservation for restyles; and things to avoid.

It avoids contradictions and repetition:

- Preserving *composition* drops the composition and aspect instructions.
- Preserving *colours* replaces the palette.
- Preserving *motion and timing* (video) drops the camera and movement instructions.
- A user-chosen palette or lighting removes conflicting “avoid” items.
- Style-default lighting, composition, texture or material lines are skipped when the cues already say the same thing.
- Names ending in “Style” are never followed by “style”.
- It uses no model-specific syntax (no `--ar`, weights and so on).

The builder never silently overwrites a manually edited prompt. Changing settings shows a notice, and replacing the edit requires a confirmation dialog. Leaving the page with edits also asks first.

## Tests performed

- **Unit (37, Vitest):** determinism; subject placeholder; intensity scaling; image vs video; curated and custom palettes with exact colour counts; the contradiction rules above; lettering only when relevant; no duplicate lines; “Style style” guard; URL round-trip including Unicode subject; invalid-link recovery; subject cleaning and length cap. Also content integrity (63 styles, 24 palettes, shares = 100, links resolve, renderers exist, entries distinct), search by name / alias / description / tag, filter combination, sorting, the exact 2 / 3 / 4 palette filters, slug suggestions, colour naming and malformed storage parsing.
- **Browser (45, `npm run e2e`, real Chrome, production build):**
  - Styles: search and filters combine and persist in the URL across reload; empty state; clear; A→Z sort.
  - Palettes: 2 / 3 / 4 filters are exact.
  - Saved items: save and unsave survive refresh, and malformed or partially valid `localStorage` is handled.
  - Builder:
    - “Use in builder” carries the style; image and video prompts respond to settings; 2- and 4-colour palettes; custom colour edits update live while the curated palette stays unchanged.
    - Manual edits survive settings changes, Regenerate asks for confirmation, and Escape cancels.
    - Copy reaches the clipboard with a status message; the downloaded `.txt` matches the prompt; the share link restores an identical prompt in a new tab; Reset works.
    - Leaving with edits warns first.
  - Recovery: invalid builder params, unknown style, palette and route.
  - Keyboard and mobile: arrow-key tabs; the mobile menu.
  - **No console errors** in any of these journeys.
- **Visual review:** screenshots at 1440 px, 820 px and 390 px of the home, styles, style detail, palettes, palette detail, builder, saved, credits and 404 pages. No horizontal overflow at any size.
- `npm run typecheck` and `npm run build` pass. Initial JS is about 164 KB gzipped (framework 98 KB), and routes are code-split.

## Known limitations

- **Hex values are colour intent.** Image and video tools interpret them loosely. “Preserve” lines are instructions, not guarantees. The UI says both.
- **Illustrative studies are schematic.** For photographic or material looks (Steampunk, Clay Style, Surveillance, Bohemian, Luxury Minimal) they show ingredients, not finished photographs.
- **Share links carry settings, not manual prompt edits.** The copy-link message says so when you have edits.
- **Light and dark mode.** The header toggle switches themes. The site follows the system setting until you choose, then remembers the choice in `localStorage`; an inline script in `index.html` applies it before first paint. Theme colours are CSS variables in `src/index.css` (`:root[data-theme="dark"]`).
- **Saved items are per browser.** There are no accounts and no sync. If storage is blocked, saving works for the current visit and the site says so.
- **Hosting:** none is configured. `vite preview` serves SPA routes; a static host would need a fallback to `index.html` for deep links.
- **Accessibility:** covered by semantic markup, labelled controls, visible focus, a skip link, focus management on route change, a native `<dialog>` for confirmations, and selection shown with ✓ marks and fills (not colour alone). It has not been tested with a physical screen reader.
- **The Awwwards reference** was read as a text summary (layout, filter placement, card anatomy), not viewed visually. No branding, text or assets were taken from it.
