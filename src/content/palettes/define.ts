import type { Hex, PaletteColour, PaletteComposition, PaletteRecord, PaletteRole } from "../types";

export const p = (hex: Hex, name: string, role: PaletteRole, share: number): PaletteColour => ({ hex, name, role, share });

const ROLES: Record<number, PaletteRole[]> = {
  2: ["background", "primary"],
  3: ["background", "primary", "accent"],
  4: ["background", "primary", "secondary", "accent"],
};

/** A palette made for one style; roles follow the colour count. Colours are [hex, name, share]. */
export function stylePalette(
  style: string,
  d: { slug: string; name: string; mood: string; description: string; composition: PaletteComposition; colours: [Hex, string, number][] },
): PaletteRecord {
  const roles = ROLES[d.colours.length];
  if (!roles) throw new Error(`${d.slug}: palettes have 2 to 4 colours`);
  return {
    slug: d.slug,
    name: d.name,
    mood: d.mood,
    description: d.description,
    composition: d.composition,
    suits: [style],
    colours: d.colours.map(([hex, name, share], i) => p(hex, name, roles[i]!, share)),
  };
}
