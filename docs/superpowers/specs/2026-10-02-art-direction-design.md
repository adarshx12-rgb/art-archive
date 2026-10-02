# Art direction for prompts — design

Date: 2026-10-02
Status: draft, awaiting review

## Why

Assume the visitor has no taste and no graphic-design knowledge. Today the
builder turns their settings into an accurate list of attributes
(`composePrompt`), and **Perfect prompt** (`worker/prompt.ts`) only rewrites
that list under a "never add anything" rule. The output is exactly as
designed as the input, so a beginner gets a generic, AI-slop result.

The site has to do the designing: read the brief (style, format, subjects,
words, palette, layout) and return a prompt at the level of a senior graphic
designer. That means one idea, a clear hierarchy, every element placed, and
a named way of making and finishing it.

The Notion prompt set
(https://achieved-cloak-445.notion.site/Prompts-397e13e8b39080b4beebf8da644def5f)
is the quality bar, not a template to copy.

## Decisions

| Question | Decision |
|---|---|
| How much may the art director add? | **B.** Every subject, colour, typed word and reference image is locked. It may decide technique, crop and scale, composition device, finish, and add **non-verbal** graphic furniture (barcode, badge, registration marks…). It never invents words. |
| Which prompts? | Design formats and plain new images get full art direction. Video gets the same, plus how the key frame moves. Restyle gets technique, colour treatment and finish only. |
| One prompt or a choice? | **Three concept cards**, then the full prompt for the one picked. |
| Where does design knowledge come from? | A structured brief backed by a hand-curated **craft library**, plus a short art-director method and a few exemplar prompts in the instructions. |

## Flow

1. The visitor sets up the builder as today. The deterministic composed prompt
   stays where it is, unchanged.
2. **Design ideas** (replaces **Perfect prompt**) calls `POST /api/concepts`
   and shows three concept cards: title, one-line idea, 3–4 tags.
3. **Use this** on a card calls `POST /api/prompt` with that brief. The result
   fills the existing editable prompt box. The edit, regenerate and "Update
   scene from prompt" flows are unchanged.
4. **More ideas** asks for three new concepts and sends the titles already
   shown so they aren't repeated.

The chosen brief lives in page state only. The share-link format doesn't change.

## Components

### `src/content/craft.ts`: craft library

About 60–80 hand-curated entries:

```ts
export interface CraftEntry {
  id: string;                       // "halftone-screen"
  kind: "technique" | "device" | "furniture" | "finish";
  phrase: string;                   // prompt-ready: "coarse halftone-dot screen across the image"
  suits: (FormFacet | ColourFacet)[]; // matched against the style's facets
  video?: string;                   // how it behaves in motion, when it differs
}
```

- **technique** (~25): how the hero is made. Examples: halftone screen, 1-bit
  dither, duotone, risograph overprint, pixel-mosaic silhouette fill, linocut,
  cyanotype, photocopy blow-up, airbrush gradient, chrome render, cut paper.
- **device** (~20): the main compositional move. Examples: colossal crop off
  the edge, cutout window revealing a photo, silhouette filled with another
  image, giant numeral or letter as the ground, stacked type column, single
  band across the frame, tiny subject in vast empty space, torn split.
- **furniture** (~15, all non-verbal): barcode, calibration strip,
  registration marks, keyline border, pill badge (holding only typed words),
  checkerboard square, crosshair or caret glyphs, tiny photo tiles, tape strips.
- **finish** (~12): photocopy contrast, screenprint grain, newsprint halftone,
  scanned-paper creases, offset misregistration, paper tooth, toner specks.

`craftFor(style)` returns the entries whose `suits` overlap the style's
`formFacets` and `colourFacets`. Results are ranked by overlap and capped at
about 30, with at least a few of each kind.

### `worker/concepts.ts`: `POST /api/concepts`

Request: `{ query: string /* share-link state */, exclude?: string[] /* titles shown */ }`.

The model's input:
- the composed facts (`composePrompt`)
- the style's name, look and cues
- the palette with colour names and hex codes
- the format and template blocks
- the subjects with position, size and facing
- the typed words
- pinned comments
- the craft shortlist

The model returns three briefs:

```ts
interface Brief {
  title: string;        // card headline, plain words, ≤ 4 words
  idea: string;         // one sentence a non-designer understands
  hero: { subject: string | null; treatment: string; scale: string | null }; // subject = one of the visitor's subjects
  device: string | null;
  furniture: string[];  // 0–3, non-verbal
  type: string | null;  // hierarchy over the typed words only; null when there are none
  colour: string | null; // restyle: how the palette is applied (e.g. "two-colour riso overprint")
  finish: string;
  craft: string[];      // ids of library entries used
  motion: string | null; // video: how the key frame moves
}
```

For restyle, `hero.subject`, `hero.scale`, `device` and `type` are `null` and
`furniture` is empty. Only `hero.treatment`, `colour` and `finish` are filled,
and the library rule asks for a technique (devices don't apply).

**The art-director method** (system instructions, kept short):
1. Find the one idea: what the piece is about, and the single image that says it.
2. Make one thing dominant through scale, contrast or isolation. Everything
   else supports it.
3. Use restraint: at most about 5 visual elements, with deliberate empty space.
4. Build the type hierarchy from the visitor's words only: one display line
   and small supporting text.
5. Place every element in the frame.
6. Name how it is physically made and finished, so it reads as printed or
   crafted, not "rendered".
7. Make the three concepts genuinely different, not variations of one idea.

The visitor's subject names and words are data. The instructions say so, as
`prompt.ts` already does.

### `worker/prompt.ts`: final prompt from a brief

`PromptRequest` gains an optional `brief`. When a brief is given, a new
art-director `SYSTEM` turns facts plus brief into the final prompt, in this
order:

1. format and orientation
2. ground (background colour)
3. hero and its treatment
4. device
5. placed furniture
6. lettering, with the typed words quoted exactly
7. finish
8. `Avoid:` line

Colours appear as name plus hex, with their share. "Attach image…" and
"Image N:" lines are copied word for word, as today. Three or four exemplar
prompts are included as a quality reference, written to the Notion bar and
not copied from it. The target length is about 110–200 words.

Without a brief, the endpoint behaves as today, so older clients keep working.

### `src/lib/art/brief.ts`: checks (pure, shared)

- `checkBrief(brief, state)` returns a list of problems:
  - the hero subject isn't one of the visitor's subjects (create only)
  - a quoted string isn't one of the typed words
  - furniture contains words (any quoted text, or "reading …"/"saying …")
  - neither the technique nor the device comes from the library (`craft` ids
    must exist; at least one must be a technique or a device)
  - there are more than 3 furniture items
- `checkSet(briefs)` reports concepts whose technique and device are both the
  same as another concept's.
- `slop(prompt)` finds filler words: stunning, vibrant, highly detailed, 8k,
  4k, masterpiece, cinematic, intricate, epic, trending, award-winning,
  breathtaking, ultra-realistic. The final prompt has them removed, and the
  instructions explain why they are banned.
- The final prompt also runs the existing `mustInclude` checks, plus a check
  that it contains no quoted text other than the typed words.

### UI: `src/pages/Builder.tsx` and a new `src/components/ConceptCards.tsx`

- The **Design ideas** button sits in the place of Perfect prompt.
- Three cards in a row, stacked on narrow screens. Each shows the title, the
  idea, tags (phrases of the `craft` ids used) and a **Use this** button.
- While the call runs, the cards show skeleton placeholders with "Thinking like
  a designer…".
- **More ideas** sits under the cards.
- `src/lib/ai.ts` gains `aiConcepts(state, exclude)`, and `aiPrompt(state, brief?)`
  gains the optional brief.

## Failure handling

- The concepts call fails: show a toast. The composed prompt is still there.
- After one repair pass (same model, with the problems listed), drop any brief
  that still fails `checkBrief`. Show the ones that passed (1–3). If none pass,
  show the error toast.
- The final prompt still misses something after the existing repair and
  next-model passes: show the existing warnings.
- Model chain: `OPENROUTER_PROMPT_MODELS`. The concepts call uses `medium`
  effort. No new environment settings.

## Testing

- **Unit (vitest, next to the code):**
  - `craftFor` matches facets and returns a few of each kind
  - every library entry has a valid kind and facets, and ids are unique
  - `checkBrief` catches: an invented quote, a non-visitor hero, worded
    furniture, no library pick, too much furniture
  - `checkSet` catches duplicate concepts
  - `slop` finds and removes filler
- **Worker (mocked `ask`, like `worker/guide.test.ts`):** the concepts repair
  pass, partial results, restyle briefs, `exclude` reaching the model, and the
  prompt endpoint with and without a brief.
- **Live eval:** `scripts/eval-ai.mjs` gains about 8 novice cases (for example
  "a cat, Swiss, poster" and "birthday flyer, text 'Maya turns 30'", plus one
  video and one restyle). It checks structure and rules, and writes every
  concept and prompt to `docs/art-direction-samples.md` for side-by-side
  review against the quality bar.

## Example

Input: Punk, poster, subject "a woman dancing", text "Night Shift".

Today's composed prompt lists the style's attributes ("chaotic cut-and-paste
layouts, crooked blocks, overlapping text…") with no idea, no hierarchy and
no placement.

With art direction, the concepts are **Torn in two**, **Through the window**
and **Copier drag**. The prompt for "Torn in two":

> Punk poster, 4:5 portrait. Xerox-white (#F0EEE7) sheet, about 60% of the
> frame. A woman dancing, mid-step with one arm thrown up, photocopied huge
> in toner black (#0F0F0F, about 30%), so close she is cropped at the knees
> and her raised hand runs off the top edge. High-contrast copier blow-up:
> blown highlights, solid black shadows, no mid-tones. The sheet is torn top
> to bottom just left of centre; the right half sits lower and slightly
> rotated, so her body no longer lines up. Across the tear, "Night Shift" in
> ransom-note letters cut from different magazines, two of them on
> fluoro-pink (#FF2E88) paper, about 10%. Two strips of yellowed masking tape
> hold the halves together. Small registration marks in the bottom-right
> corner. Finish: toner specks, a grey copier edge shadow, torn fibres along
> the rip. Lettering: spell "Night Shift" exactly; add no other words.
> Avoid: polished gradients, elegant serif type, soft pastels.

## Out of scope

- Saving briefs in share links.
- Per-style exemplar libraries.
- Connecting this to the 5-variant template plan. The craft library may feed
  it later.
- Generating images inside the site.
