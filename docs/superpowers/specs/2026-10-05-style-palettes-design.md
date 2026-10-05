# Style palettes and colour swap — design

Date: 2026-10-05 · Branch: `style-palettes` (off `custom-style`)

## Goal

Give designers a source of strong colour combinations for websites and
graphic design, organised by art style:

1. **Every art style has its own palettes.** Art Deco shows the palettes that
   suit Art Deco best; Pop Art shows Pop Art's.
2. **Swap one colour.** On a palette page, the visitor replaces one colour
   (e.g. Pop Art orange → blue). The site asks Claude for three new palettes
   that keep that colour and fill in the rest to suit the chosen style.

Success: every style page lists at least four palettes made for it, and a swap
returns three valid palettes containing the visitor's colour in a few seconds.

## Constraints

- **Palette content is written by Claude Code during the build**, as source
  files. No script calls OpenRouter or any other paid API to generate it.
- **The AI API is used only at runtime**, for the live colour swap a visitor
  triggers. It goes through the site's normal `ask()` chain (OpenRouter models,
  then Anthropic), like the other AI features, and is covered by the existing
  per-visitor `AI_LIMIT`.
- "Trending" means curated with current web and graphic design practice in
  mind (legible contrast, usable as UI colours). There is no live trend data.

## Part 1: palettes for every style (stored content)

**Content.** Four palettes per style for all 69 styles (about 276 new),
following the existing rules in `src/content/palettes.ts`: 2–4 colours, fixed
role order (background, primary, [secondary], accent), shares totalling 100,
plus `name`, `mood`, `description`, `composition` and `suits: [styleSlug]`.
Each style gets a mix of sizes (at least one 2- or 3-colour and one 4-colour
palette). Colours stay true to the style's period, materials and printing, the
same rule the existing schemes prompt uses. Slugs are unique across the whole
library.

**Files.** `src/content/palettes/` holds one file per style family, mirroring
`src/content/styles/`: `movements.ts`, `print.ts`, `retro.ts`, `digital.ts`,
`craft.ts`. The current 25 palettes move to `src/content/palettes/library.ts`
unchanged (slugs and URLs stay). `src/content/palettes/index.ts` exports the
combined `palettes` list and `getPalette`, so existing imports of
`../content/palettes` keep working.

**Style page.** "Palettes that suit it" (`src/pages/StyleDetail.tsx`) lists the
palettes curated for the style (`palettesForStyle` stops padding with "close
colour match" when the style has at least four of its own). Palette links
carry the style: `/palettes/<slug>?s=<style>`.

**Browse page.** `/palettes` gets a style filter (a select of styles that have
palettes) next to the size filter and search, stored in the `style` URL
param. `filterPalettes` takes the style slug.

## Part 2: colour swap on the palette page

**UI** (`src/pages/PaletteDetail.tsx`, "Roles and proportions"). A new
`ColourSwap` component below the role list:

- Pick the colour to replace (one button per colour, showing its swatch and
  role).
- A native colour input plus hex text field for the new colour.
- A style select: the styles the palette suits first, then every other style
  in a second group. It starts on the `?s=` style when that style is valid,
  else the palette's first suited style.
- **Suggest** button; while waiting it reads "Thinking…".

**Results.** The original palette stays. Three result cards appear below, each
with a proportion bar, hex chips (click to copy), the palette name, a one-line
reason, **Copy all** and **Open in builder** (`/builder?pm=custom&c=…&s=…`).
Shares are copied from the original palette, since roles are unchanged.

**API.** `POST /api/swap` with
`{ style, colours: [{hex, name, role}], index, hex }`, validated with zod (2–4
colours, valid hexes, `index` in range, known style). Handled by
`worker/swap.ts`, which calls `ask()` with `effort: "low"`.
The prompt is modelled on `SCHEMES_SYSTEM`: three distinct palettes, same size
and roles as the original, the locked colour unchanged, true to the style.

**Validation.** The worker forces the locked colour back to the visitor's hex
at `index`, drops palettes of the wrong size or with invalid hexes, and
deduplicates. No valid palette → `AiError` 502 "Couldn't build palettes around
that colour. Try again." The UI shows the error with a retry. No Anthropic key
configured → the existing 503 message.

**Client.** `src/lib/ai.ts` gets `swapColour()` posting to `/api/swap`, typed
like `suggestSchemes`.

## Testing

- `src/lib/catalogue.test.ts`: every registered style (excluding custom) has at
  least four palettes curated for it; all palettes valid (role order, shares
  total 100, unique slugs, valid hex, `suits` slugs exist); style filter
  returns only that style's palettes.
- `worker/swap.test.ts`: request validation; locked colour enforced when the
  model changes it; wrong-size and bad-hex palettes dropped; all-invalid → 502.
- `npm run typecheck`, `npm test`, then manual check in the dev server.

## Order of work

1. `/api/swap` + `ColourSwap` UI.
2. Split palettes into `src/content/palettes/`, add style filter and `?s=` links.
3. Write palettes family by family (movements, print, retro, digital, craft),
   tests passing after each.

## Out of scope

Saving swapped palettes as new library entries, export formats beyond copying
hex codes, and swap on the builder page.
