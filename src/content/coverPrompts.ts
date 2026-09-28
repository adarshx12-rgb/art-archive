import source from "../../docs/cover-prompts.md?raw";

/**
 * Cover-image prompts, parsed from docs/cover-prompts.md so the doc stays
 * the single source. Keyed by style slug.
 */
export interface CoverPrompt {
  slug: string;
  /** e.g. "1962 typographic concert poster (Screen print)" */
  artwork: string;
  /** e.g. "tall 2:3" */
  format: string;
  prompt: string;
  /** Follow-up to send when the first result misses. */
  ifItMisses?: string;
}

export function parseCoverPrompts(md: string): Record<string, CoverPrompt> {
  const out: Record<string, CoverPrompt> = {};
  for (const section of md.replace(/\r\n/g, "\n").split(/^## \d+\. .*$/m).slice(1)) {
    const slug = section.match(/^- Slug: `([^`]+)`/m)?.[1];
    const prompt = section.match(/```text\n([\s\S]*?)\n```/)?.[1]?.trim();
    if (!slug || !prompt) continue;
    out[slug] = {
      slug,
      artwork: section.match(/^- Artwork: (.+)$/m)?.[1]?.trim() ?? "",
      format: section.match(/^- Format: (.+)$/m)?.[1]?.trim() ?? "",
      prompt,
      ifItMisses: section.match(/^\*\*If it misses:\*\* (.+)$/m)?.[1]?.trim(),
    };
  }
  return out;
}

export const coverPrompts = parseCoverPrompts(source);
