import type { Comment } from "../prompt/state";
import type { Projected } from "./camera";
import { subjectAt } from "./describe";
import { widthRatio } from "./model";

// Correct common instruction typos only; never alter the words to be lettered.
const normalise = (text: string) => text.toLowerCase().replace(/\b(?:etxt|tetx|txet|txt)\b/g, "text").replace(/\bdiagaonally\b/g, "diagonally");
const positive = (text: string) => normalise(text).replace(/\b(?:don't|do not|never|avoid|no)\b[^.;!?]*/g, " ");
const TEXT = /\b(?:text|words?|phrase|lettering|letters?|type|pattern)\b/;

/** Explicit comment edits take precedence over the current board's geometry. */
export function textDirectives(projected: Projected[], comments: Comment[], aspect: number) {
  const texts = projected.filter((p) => p.glyph === "text");
  const handled = new Set<number>();
  const targets = (comment: Comment) => {
    const words = normalise(comment.text);
    const named = texts.find((p) => words.includes(`"${p.label.toLowerCase()}"`) || words.includes(`“${p.label.toLowerCase()}”`));
    const hit = subjectAt(comment.x, comment.y, texts, aspect);
    const singlePhrase = new Set(texts.map((p) => p.label)).size === 1;
    return named ?? hit ?? (singlePhrase ? texts[0] : undefined);
  };
  let pattern: { label: string; samples: Projected[]; comment: number } | undefined;
  for (const [index, comment] of comments.entries()) {
    const instruction = positive(comment.text);
    const canvas = /\b(?:canvas|background|frame|image|board|page)\b/.test(instruction);
    const whole = /\b(?:entire|whole|full|everywhere|all over|edge.to.edge)\b/.test(instruction) || /\bacross (?:the )?(?:canvas|background|frame|image|board|page)\b/.test(instruction);
    if (TEXT.test(instruction) && canvas && whole && /\b(?:fill|cover|repeat|tile|extend|spread)\b/.test(instruction)) {
      const target = targets(comment);
      if (target) {
        pattern = { label: target.label, samples: texts.filter((p) => p.label === target.label), comment: index };
      }
    }
  }

  const lines: string[] = [];
  const locked = pattern ? texts.filter((p) => p.label !== pattern.label) : texts;
  const percent = (n: number) => `${Math.round(n * 1000) / 10}%`;
  const median = (numbers: number[]) => [...numbers].sort((a, b) => a - b)[Math.floor(numbers.length / 2)]!;
  if (pattern) {
    handled.add(pattern.comment);
    const height = median(pattern.samples.map((p) => p.size));
    const width = median(pattern.samples.map((p) => p.size * widthRatio(p.glyph, p.label) * (p.stretch ?? 1) * (p.count + 0.15 * (p.count - 1)) / aspect));
    const rotation = median(pattern.samples.map((p) => ((p.rotation + 180) % 360 + 360) % 360 - 180));
    const angle = Math.round(Math.abs(rotation) * 10) / 10;
    const diagonal = /diagonal/.test(normalise(comments[pattern.comment]!.text));
    const direction = angle ? `${angle} degrees ${rotation < 0 ? "counterclockwise, rising to the right" : "clockwise, falling to the right"}` : diagonal ? "diagonally, rising to the right" : "horizontal";
    lines.push(`Text pattern: Fill the entire canvas edge to edge with repeating "${pattern.label}" in evenly spaced parallel rows, ${direction}. Keep every copy the same large size: unrotated width about ${percent(width)} of the frame width and letter height about ${percent(height)} of the frame height. Continue through the top, middle and bottom and beyond all four edges, clipping naturally. The placed copies are size and angle samples, not a limit on the number of repetitions. Add as many copies as needed; no empty lower area, separate headline or smaller background pattern. This fill-canvas comment overrides the samples' original positions and count.`);
  }

  for (const [index, comment] of comments.entries()) {
    const instruction = positive(comment.text);
    if (!TEXT.test(instruction) || !/\b(?:blend|merge|fade|low.contrast|tone.on.tone)\b/.test(instruction) || !/\b(?:background|ground|canvas)\b/.test(instruction)) continue;
    const target = targets(comment);
    if (!target) continue;
    const local = /\b(?:this|one|only|single|selected)\b/.test(instruction);
    const uniform = pattern?.label === target.label && !local;
    const scope = uniform ? `every repetition of "${target.label}" across the whole pattern`
      : locked.includes(target) ? `text element ${locked.indexOf(target) + 1}, "${target.label}"`
      : `only the copy of "${target.label}" at the marked location, centred ${percent(target.x)} from the left and ${percent(target.y)} from the top`;
    lines.push(`Text treatment: Blend ${scope} with the background using reduced contrast: composite the selected lettering colour translucently over the background colour, keeping the words readable. ${uniform ? "Apply the same opacity and tonal treatment to all copies, not one isolated ghost line among opaque copies. " : ""}This comment overrides opaque lettering and default palette proportions; derive the blended tone from the selected colours, without adding an unrelated accent.`);
    handled.add(index);
  }
  return { pattern, lines, handled, locked };
}
