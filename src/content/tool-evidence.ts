/**
 * What professional designers found when they ranked image tools on the same
 * design briefs: TASTE (Zhu et al., 2026, arXiv:2605.20731; MIT-licensed data
 * at huggingface.co/datasets/purvanshi/TASTE). Ten designers ranked four
 * tools' renders of 721 briefs on nine criteria and flagged invented content.
 *
 * Mean rank out of 4 (1 is best) on the "descriptions" track, which judges how
 * faithfully a render follows the brief. Recomputed from the rankings table;
 * refresh when the dataset or the tools change.
 */
export const BRIEF_FIDELITY = {
  source: "TASTE designer rankings (2026)",
  best: "Nano Banana 2",
  meanRank: {
    typography: { "Nano Banana 2": 1.98, "Seedream 5.0 Lite": 2.62, "FLUX.2 [max]": 2.58, "GPT Image 1.5": 2.81 },
    spatial: { "Nano Banana 2": 2.05, "Seedream 5.0 Lite": 2.44, "FLUX.2 [max]": 2.59, "GPT Image 1.5": 2.91 },
    colour: { "Nano Banana 2": 2.14, "Seedream 5.0 Lite": 2.45, "GPT Image 1.5": 2.61, "FLUX.2 [max]": 2.8 },
  },
  /** On pure looks ("aesthetics" track) the four were close; these led. */
  looks: { typography: "FLUX.2 [max]", mood: "GPT Image 1.5" },
  /** Share of renders designers flagged for invented or garbled content, minor or major, across the four tools. */
  inventedContent: { min: 0.43, max: 0.53 },
} as const;

/** The criteria the designers judged on: the axes a prompt's design decisions should be checked against. */
export const DESIGN_CRITERIA = {
  looks: ["typography", "visual hierarchy", "colour harmony", "mood and colour tone"],
  faithfulness: ["exact typography", "layout as described", "colours as described"],
} as const;
