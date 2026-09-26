import type { Hex, NamedColour, StyleRecord } from "../types";

/** Shorthand for a named colour. */
export const c = (hex: Hex, name: string): NamedColour => ({ hex, name });

type StyleInput = Omit<StyleRecord, "art" | "references" | "related" | "aliases"> &
  Partial<Pick<StyleRecord, "art" | "references" | "related" | "aliases">>;

/** Fills optional fields so entries can stay short. */
export function defineStyle(input: StyleInput): StyleRecord {
  return {
    aliases: [],
    references: [],
    related: [],
    art: { kind: "study" },
    ...input,
  };
}
