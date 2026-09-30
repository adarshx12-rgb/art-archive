import { parseSubject } from "../sketch/parse";

/**
 * What the subject box does with what's typed: a plain subject ("an old
 * fisherman") is placed at once on the device; anything that describes a
 * layout ("a cat on a table", "put the moon behind the castle") is laid out
 * by the server (see worker/scene.ts).
 */

const COMMANDS = new Set(["add", "put", "place", "move", "make", "remove", "delete", "turn", "rotate", "change", "replace", "swap", "bring", "set", "draw", "show", "give", "let", "flip", "shrink", "enlarge", "raise", "lower"]);

const RELATIONS = /\b(on|onto|atop|top|above|below|under|underneath|beneath|over|behind|beside|besides|next|near|nearby|between|around|among|inside|outside|background|foreground|backdrop|left|right|middle|centre|center|front|far|distance|ground|sky|holding|riding|carrying)\b/;

/** `{text}`, with any spacing or case, stands for the words in the "Text in the image" box. */
const PLACEHOLDER = /\{\s*text\s*\}/gi;

export function needsLayout(input: string): boolean {
  const text = input.trim().toLowerCase();
  if (!text) return false;
  if (/["“”«»]|\{\s*text\s*\}/i.test(text)) return true;
  const first = text.split(/[^a-z]+/).find(Boolean) ?? "";
  if (COMMANDS.has(first)) return true;
  if (RELATIONS.test(text)) return true;
  // Several different things ("a woman and her dog") need arranging.
  return new Set(parseSubject(text).items.map((i) => i.glyph)).size > 1;
}

/** Put the lettering in place of `{text}`, quoted so the server knows it is words to letter. */
export function fillText(input: string, lettering: string): { request: string; used: boolean; missing?: true } {
  PLACEHOLDER.lastIndex = 0;
  if (!PLACEHOLDER.test(input)) return { request: input, used: false };
  const words = lettering.trim();
  if (!words) return { request: input, used: false, missing: true };
  return { request: input.replace(PLACEHOLDER, `"${words.replace(/"/g, "'")}"`), used: true };
}
