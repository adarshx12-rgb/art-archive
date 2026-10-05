import { z } from "zod";
import { palettes } from "../src/content/palettes";
import { getStyle } from "../src/content/styles";
import type { Hex, PaletteRole, PaletteSize } from "../src/content/types";
import { normaliseHex } from "../src/lib/color";
import { ROLE_ORDER } from "../src/lib/prompt/compose";
import { AiError, ask } from "./ai";
import type { Env } from "./env";

const HexIn = z.string().regex(/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/);

export const SwapRequest = z
  .object({
    style: z.string().max(80),
    colours: z.array(z.object({ hex: HexIn, name: z.string().max(40) })).min(2).max(4),
    index: z.number().int().min(0),
    hex: HexIn,
  })
  .refine((b) => b.index < b.colours.length);

const SwapOut = z.object({
  palettes: z
    .array(
      z.object({
        name: z.string().describe("A short evocative name, 1-3 words."),
        colours: z.array(z.object({ hex: z.string().describe("Six-digit hex."), name: z.string().describe("Plain colour name, e.g. 'cobalt'.") })),
        why: z.string().describe("One sentence on why it works for the style, naming the colour principle used."),
      }),
    )
    .describe("Exactly three palettes."),
});

/** How many of the style's own palettes to show the model as examples. */
const EXAMPLES = 6;

/**
 * The colour knowledge the model works from. It is taught, not trained: the
 * principles below, plus the style's own hand-made palettes as examples.
 */
const SWAP_SYSTEM = `You are a senior colour designer. A designer has replaced one colour in a palette made for one art style. Rebuild the rest of the palette around their colour. The palettes are used for websites and graphic design.

Output: exactly three palettes. Each has the same number of colours as the original, in the same role order (background, primary, then secondary and accent), and keeps the chosen colour exactly, in the same position.

Work from these principles:
- Value first. Colours must differ clearly in lightness, not only in hue. The primary must be legible on the background: aim for a WCAG contrast of 4.5:1 or more, never below 3:1. If the chosen colour is the background or primary, choose its partner by lightness first.
- Proportion. The background covers about 60% of the area, the primary about 30%, the accent about 10%. Only one colour should be fully saturated and loud; let the others support it.
- Temperature. Balance warm and cool on purpose: a cool chosen colour usually wants a warm neutral or a warm accent beside it, and vice versa, unless the style is deliberately monochrome.
- Harmony. Use a clear relationship, such as complementary (opposite hues), split-complementary, analogous (neighbouring hues) or one hue with tints and shades. Name the one you used in "why".
- Neutrals are rarely pure. Prefer warm off-whites, papers and deep inks to #FFFFFF and #000000, unless the style demands pure black and white (e.g. Swiss, brutalist, 1-bit).
- No muddy mixes: avoid pairing desaturated colours of the same lightness, and avoid two near-duplicates.
- Respect the style. Stay true to its period, materials, printing and pigments, as shown by its description, its swatches and the example palettes. Never borrow another movement's look (no vaporwave pastels for Art Deco, no neon for Arts and Crafts).

Make the three palettes different from each other: one close to the original's mood, one bolder, one quieter or more refined. Study the examples for this style's colour sense, but do not copy them. Give each colour a plain, specific name a person would say ("cobalt", "oxblood", "bone").`;

type Swapped = { name: string; colours: { hex: Hex; name: string; role: PaletteRole }[]; why: string };

/** Three palettes that keep the visitor's colour at `index`; invalid ones are dropped. */
export async function swapColour(env: Env, body: z.infer<typeof SwapRequest>, override?: string | null) {
  const style = getStyle(body.style);
  if (!style) throw new AiError("That style isn’t in the library.", 400, false);
  const locked = normaliseHex(body.hex)!;
  const size = body.colours.length as PaletteSize;
  const roles = ROLE_ORDER[size];
  const examples = palettes
    .filter((p) => p.suits.includes(style.slug))
    .slice(0, EXAMPLES)
    .map((p) => ({ name: p.name, mood: p.mood, colours: p.colours.map((c) => `${c.role}: ${c.name} ${c.hex} (${c.share}%)`) }));
  const input = {
    style: { name: style.name, description: style.description, colour: style.look.colour, avoid: style.prompt.avoid, swatches: style.swatches.map((s) => `${s.name} ${s.hex}`) },
    examples,
    original: body.colours.map((c, i) => ({ role: roles[i], hex: normaliseHex(c.hex), name: c.name })),
    keep: { position: body.index + 1, role: roles[body.index], hex: locked },
  };
  const { data, usage, model } = await ask(env, { system: SWAP_SYSTEM, user: JSON.stringify(input), schema: SwapOut, name: "swap", effort: "low" }, override);

  const seen = new Set<string>();
  const out: Swapped[] = [];
  for (const p of data.palettes) {
    if (p.colours.length !== size) continue;
    const hexes = p.colours.map((c, i) => (i === body.index ? locked : normaliseHex(c.hex)));
    if (!hexes.every((h): h is Hex => Boolean(h))) continue;
    const key = hexes.join();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: p.name.slice(0, 40), colours: hexes.map((hex, i) => ({ hex, name: p.colours[i]!.name.slice(0, 40), role: roles[i]! })), why: p.why.slice(0, 300) });
    if (out.length === 3) break;
  }
  if (!out.length) throw new AiError("Couldn’t build palettes around that colour. Try again.", 502, false);
  return { palettes: out, model, usage };
}
