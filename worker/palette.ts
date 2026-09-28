import { z } from "zod";
import { getStyle } from "../src/content/styles";
import type { Hex, PaletteSize } from "../src/content/types";
import { contrastRatio, normaliseHex } from "../src/lib/color";
import { ROLE_ORDER } from "../src/lib/prompt/compose";
import { ask } from "./ai";
import type { Env } from "./env";

export const PaletteRequest = z.object({
  request: z.string().min(1).max(400),
  style: z.string().max(80),
  count: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});

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

const SYSTEM = `You design small colour palettes for image prompts. Return exactly the number of colours asked for, in role order:
- 2 colours: background, primary
- 3 colours: background, primary, accent
- 4 colours: background, primary, secondary, accent
The background covers most of the image; the primary must read clearly against it; the accent is used sparingly. Suit the requested mood and the given style, avoid near-duplicates, and give each colour a plain, specific name a person would say ("oxblood", "sea-glass green").`;

export async function suggestPalette(env: Env, body: z.infer<typeof PaletteRequest>) {
  const style = getStyle(body.style);
  const input = {
    request: body.request,
    colours: body.count,
    style: style ? { name: style.name, colour: style.look.colour, swatches: style.swatches.map((s) => `${s.name} ${s.hex}`) } : null,
  };
  const { data, usage } = await ask(env, { system: SYSTEM, user: JSON.stringify(input), schema: PaletteOut, effort: "low" });

  const roles = ROLE_ORDER[body.count as PaletteSize];
  const colours = data.colours
    .slice(0, body.count)
    .map((c) => ({ hex: normaliseHex(c.hex), name: c.name.slice(0, 40) }))
    .filter((c): c is { hex: Hex; name: string } => Boolean(c.hex));
  if (colours.length !== body.count) throw new Error("palette-shape");
  const warnings: string[] = [];
  const ratio = contrastRatio(colours[0]!.hex, colours[1]!.hex);
  if (ratio < 3) warnings.push(`The primary colour is hard to read on the background (contrast ${ratio.toFixed(1)}:1).`);
  return {
    name: data.name.slice(0, 40),
    colours: colours.map((c, i) => ({ ...c, role: roles[i]! })),
    why: data.why.slice(0, 300),
    warnings,
    usage,
  };
}
