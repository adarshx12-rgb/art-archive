import { z } from "zod";
import { DESIGN_KINDS, ROLES, type DesignKind, type Role } from "../src/content/hierarchy-patterns";

/**
 * Gold prompts: for each good inspiration image, the prompt that would
 * recreate it, written by scripts/gold-prompts.mjs. They show the director
 * and the artist what work at that level spells out, as a worked example
 * rather than abstract lessons.
 */

/** The words in a reference become these, so a gold prompt teaches the design, never someone's copy. */
export const PLACEHOLDER = /\[(?:BRAND|HEADLINE|SUBHEAD|OFFER|CTA|CONTACT|DATE|DETAIL|BODY)(?: \d+)?\]/;

const part = (what: string) => z.string().min(20).max(500).describe(what);
export const GoldSections = z.object({
  format: part("What the piece is and its aspect, e.g. 'Gig poster, 4:5 portrait.'"),
  ground: part("The ground: colour by name and approximate hex, its share of the frame and how it is used."),
  hero: part("The main image or type-as-image: what it is (anonymous category), how it is made, its scale and crop."),
  layout: part("Placement and reading order of every element, with placeholders for words, and the one compositional device."),
  lettering: z.string().max(500).describe("Letterforms and type treatment per placeholder; empty string if the image has no words."),
  finish: part("Surface and print finish actually visible; smooth if smooth."),
  avoid: part("One line starting 'Avoid:' naming what would break this design."),
});
export type GoldSections = z.infer<typeof GoldSections>;

export const GoldSchema = z.object({
  quality: z.enum(["strong", "ok", "weak"]).describe("weak: AI-looking, watermarked, misspelt, clumsy or generic; it will not be used."),
  qualityReason: z.string().min(10).max(300),
  kind: z.enum(DESIGN_KINDS as [DesignKind, ...DesignKind[]]),
  roles: z.array(z.enum(ROLES as [Role, ...Role[]])).max(9).describe("Content roles visible in the design."),
  textLoad: z.enum(["none", "light", "heavy"]),
  colours: z.array(z.object({ name: z.string().min(2).max(40), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })).min(1).max(6),
  sections: GoldSections,
});
export type GoldAnswer = z.infer<typeof GoldSchema>;

const ORDER = ["format", "ground", "hero", "layout", "lettering", "finish", "avoid"] as const;
export const goldText = (s: GoldSections) => ORDER.map((k) => s[k].trim()).filter(Boolean).join("\n");

export interface GoldReference {
  id: string;
  folders: string[];
  kind: DesignKind;
  roles: Role[];
  textLoad: "none" | "light" | "heavy";
  medium: string;
  structure: string;
  density: string;
  quality: "strong" | "ok";
  colours: { name: string; hex: string }[];
  sections: GoldSections;
  prompt: string;
}

export interface GoldRecord {
  id: string;
  folders: string[];
  paths: string[];
  study: { medium: string; structure: string; density: string };
  gold: GoldAnswer;
}

/** The usable gold prompts: good quality, not excluded by the user, the right length, each image once. */
export function compileGold(records: GoldRecord[], exclude: Set<string>): GoldReference[] {
  const seen = new Set<string>();
  const out: GoldReference[] = [];
  for (const r of records) {
    if (seen.has(r.id) || r.gold.quality === "weak" || r.paths.some((p) => exclude.has(p))) continue;
    const prompt = goldText(r.gold.sections);
    if (prompt.length < 600 || prompt.length > 1600) continue;
    seen.add(r.id);
    const { kind, roles, textLoad, colours, sections } = r.gold;
    out.push({ id: r.id, folders: r.folders, kind, roles, textLoad, ...r.study, quality: r.gold.quality, colours, sections, prompt });
  }
  return out;
}
