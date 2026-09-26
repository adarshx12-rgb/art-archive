import type { Renderer } from "../util";
import { craftStudies } from "./craft";
import { digitalStudies } from "./digital";
import { movementStudies } from "./movements";
import { printStudies } from "./print";
import { retroStudies } from "./retro";

/**
 * Original SVG studies, keyed by style slug (or `art.renderer`).
 * These are illustrative compositions made for this app — never
 * historical examples — and the UI labels them that way.
 */
export const renderers: Record<string, Renderer> = {
  ...movementStudies,
  ...printStudies,
  ...retroStudies,
  ...digitalStudies,
  ...craftStudies,
};
