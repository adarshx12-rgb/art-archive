import alternates from "../../docs/cover-prompts-alternates.md?raw";
import source from "../../docs/cover-prompts.md?raw";

/**
 * Cover-image prompts, parsed from docs/cover-prompts.md (one per style)
 * and docs/cover-prompts-alternates.md, so the docs stay the single source.
 */
export interface CoverPrompt {
  slug: string;
  /** e.g. "1962 typographic concert poster (Screen print)" */
  artwork: string;
  /** e.g. "tall 2:3" */
  format: string;
  prompt: string;
  /** The original in covers-src this prompt made, e.g. "gothic2.png". */
  cover?: string;
  /** Follow-up to send when the first result misses. */
  ifItMisses?: string;
}

export function parseCoverPrompts(md: string): CoverPrompt[] {
  const out: CoverPrompt[] = [];
  for (const section of md.replace(/\r\n/g, "\n").split(/^## .*$/m).slice(1)) {
    const slug = section.match(/^- Slug: `([^`]+)`/m)?.[1];
    const prompt = section.match(/```text\n([\s\S]*?)\n```/)?.[1]?.trim();
    if (!slug || !prompt) continue;
    out.push({
      slug,
      artwork: section.match(/^- Artwork: (.+)$/m)?.[1]?.trim() ?? "",
      format: section.match(/^- Format: (.+)$/m)?.[1]?.trim() ?? "",
      prompt,
      cover: section.match(/^- Cover: `covers-src\/([^`]+)`/m)?.[1],
      ifItMisses: section.match(/^\*\*If it misses:\*\* (.+)$/m)?.[1]?.trim(),
    });
  }
  return out;
}

/** The live prompt for each style, keyed by slug. */
export const coverPrompts: Record<string, CoverPrompt> = Object.fromEntries(parseCoverPrompts(source).map((c) => [c.slug, c]));

const byImage = new Map([...parseCoverPrompts(source), ...parseCoverPrompts(alternates)].filter((c) => c.cover).map((c) => [c.cover!, c]));

/** The prompt that made a given cover image, from either doc. */
export function promptForImage(file: string): CoverPrompt | undefined {
  return byImage.get(file);
}
