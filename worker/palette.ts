import { z } from "zod";
import { getStyle } from "../src/content/styles";
import type { Hex, PaletteRole, PaletteSize } from "../src/content/types";
import { normaliseHex } from "../src/lib/color";
import { ROLE_ORDER } from "../src/lib/prompt/compose";
import { AiError, ask } from "./ai";
import type { Env } from "./env";

const PaletteOut = z.object({
  name: z.string().describe("A short evocative name for the palette, 1-3 words."),
  colours: z
    .array(
      z.object({
        hex: z.string().describe("Six-digit hex, e.g. #1A2B3C."),
        name: z.string().describe("A plain descriptive colour name for prompts, e.g. 'faded teal'."),
      }),
    )
    .describe("Exactly the requested number of colours, in role order: background, primary, then secondary/accent."),
  why: z.string().describe("One sentence on why it suits the request and style."),
});

export const SchemesRequest = z.object({
  style: z.string().max(80),
  /** Optional mood or scene to steer the schemes. */
  request: z.string().max(400),
});

const SchemesOut = z.object({
  schemes: z.array(PaletteOut).describe("Exactly three palettes: one with 2 colours, one with 3 and one with 4."),
});

const SCHEMES_SYSTEM = `You design colour schemes for image prompts in one art style. Return exactly three palettes, one each with 2, 3 and 4 colours, in role order:
- 2 colours: background, primary
- 3 colours: background, primary, accent
- 4 colours: background, primary, secondary, accent
Every scheme must be true to the style's own colour sense (its period, materials, printing and pigments); never borrow another movement's look, e.g. no vaporwave pastels for Art Deco. Make the three schemes different from each other and from the style's own swatches, which are context, not an answer. If a mood or scene is given, design for it within the style. The background covers most of the image; the primary must read clearly against it; the accent is used sparingly. Avoid near-duplicates, and give each colour a plain, specific name a person would say ("oxblood", "sea-glass green").`;

/** Three schemes (2, 3 and 4 colours) for a style; invalid ones are dropped. */
export async function suggestSchemes(env: Env, body: z.infer<typeof SchemesRequest>, override?: string | null) {
  const style = getStyle(body.style);
  const input = {
    request: body.request.trim() || null,
    style: style ? { name: style.name, colour: style.look.colour, swatches: style.swatches.map((s) => `${s.name} ${s.hex}`) } : null,
  };
  const { data, usage, model } = await ask(env, { system: SCHEMES_SYSTEM, user: JSON.stringify(input), schema: SchemesOut, name: "schemes", effort: "low" }, override);

  const schemes = new Map<PaletteSize, { name: string; colours: { hex: Hex; name: string; role: PaletteRole }[]; why: string }>();
  for (const s of data.schemes) {
    const size = s.colours.length as PaletteSize;
    if (size < 2 || size > 4 || schemes.has(size)) continue;
    const colours = s.colours.map((c) => ({ hex: normaliseHex(c.hex), name: c.name.slice(0, 40) }));
    if (!colours.every((c): c is { hex: Hex; name: string } => Boolean(c.hex))) continue;
    schemes.set(size, { name: s.name.slice(0, 40), colours: colours.map((c, i) => ({ ...c, role: ROLE_ORDER[size][i]! })), why: s.why.slice(0, 300) });
  }
  if (!schemes.size) throw new AiError("Couldn’t come up with valid colour schemes. Try again.", 502, false);
  return { schemes: [...schemes.entries()].sort(([a], [b]) => a - b).map(([, s]) => s), model, usage };
}
