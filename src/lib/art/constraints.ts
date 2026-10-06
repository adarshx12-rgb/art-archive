import type { BuilderState } from "../prompt/state";

/** Explicit rendering constraints, not an aesthetic preference imposed on every style. */
export function incompatibleCraft(state: BuilderState): Map<string, string> {
  const conflicts = new Map<string, string>();
  const directions = [state.style === "custom" ? state.customStyle.text : "", ...state.comments.map((c) => c.text)].join(" ");
  const positiveDirections = directions.replace(/\b(?:no|without|avoid|never)\b[^.!?;]*/gi, " ");
  const cleanType = /smooth[^.!?;]{0,60}(?:letter|type)|anti.aliased[^.!?;]{0,40}(?:letter|type)/i.test(positiveDirections);
  const noTexture = /\b(?:no|without)\s+(?:print\s+)?(?:texture|grain|distress)/i.test(directions);
  if (cleanType || noTexture) {
    for (const id of ["halftone-screen", "one-bit-dither", "riso-overprint", "pixel-mosaic-fill", "photocopy-blowup", "linocut", "wood-engraving", "hand-collage", "stencil-spray", "marker-scribble", "crt-scanlines", "photocopy-contrast", "screenprint-grain", "newsprint", "scanned-paper", "misregistration", "paper-tooth", "marker-bleed"])
      conflicts.set(id, cleanType ? "Keep the explicitly requested smooth lettering; do not replace it with dotted, rough, carved or distressed type." : "Keep the explicit no-texture request; do not add a print or distress effect.");
  }
  if (state.task === "restyle" && state.preserve.includes("colours")) {
    for (const id of ["one-bit-dither", "duotone", "cyanotype", "infrared-photo", "gold-leaf"])
      conflicts.set(id, "Preserve the source colours; do not replace them with a fixed ink palette or false colours.");
  }
  return conflicts;
}

/** Clear recolouring contradictions when the source palette is unknown and must be kept. */
export function sourceColourConflict(text: string): boolean {
  const positive = text.replace(/"[^"]*"|“[^”]*”/g, " ").replace(/\b(?:no|not|without|avoid|never)\b[^.!?;]*/gi, " ");
  return /\b(?:duotone|monochrome|black.and.white|recolou?r\w*)\b|\b(?:one|single|two)[ -](?:dark )?(?:ink|colou?r)\b|\b(?:yellowed|white|ivory) (?:paper|stock)\b|\bblack (?:ink|outlines?)\b/i.test(positive);
}
