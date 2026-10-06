import { z } from "zod";

const observation = z.string().min(10).max(600);
export const StudySchema = z.object({
  summary: observation.describe("Describe the visible design, without transcribing its words or naming people or brands."),
  tags: z.array(z.string().min(2).max(45)).min(4).max(12).describe("Concrete retrieval terms: technique, mood, subject category, layout. Lowercase, no brand names."),
  medium: z.enum(["photograph", "illustration", "typography", "graphic", "mixed"]),
  structure: z.enum(["single-focus", "multi-panel", "repetition", "type-led", "scene", "full-field"]),
  density: z.enum(["sparse", "balanced", "dense"]),
  hasText: z.boolean(),
  composition: observation.describe("Visible positions, proportions, rhythm, crop and negative space; approximate, not invented precision."),
  hierarchy: observation.describe("How the eye moves; say if repetition or equal emphasis replaces a hero."),
  typography: observation.nullable().describe("Letterform, relative scale, spacing, angle and interaction with imagery; null if no lettering."),
  palette: observation.describe("Colour roles and relationships, contrast and approximate coverage, not a list of invented hex codes."),
  imageTreatment: observation.describe("Visible treatment. Distinguish visual effect from an uncertain production process."),
  finish: observation.describe("Observed surface and edge behaviour; do not invent paper grain on a smooth design."),
  lessons: z.array(z.object({
    principle: observation.describe("One reusable design decision, not an adjective."),
    evidence: observation.describe("The visible detail supporting this lesson."),
    why: observation.describe("How that detail helps this particular composition."),
    adapt: observation.describe("How to transfer the relationship to a different subject, wording, palette or aspect ratio."),
    caution: observation.describe("When this decision would fail or should not be borrowed."),
  })).min(2).max(3),
  pitfalls: z.array(observation).min(1).max(3).describe("Specific ways a shallow imitation would fail. Conditional, not blanket bans on other aesthetics."),
  confidence: z.enum(["high", "medium", "low"]),
  uncertainty: z.string().max(400).describe("Unreadable or ambiguous visual details. Empty only when none affect the observations."),
});

export type ReferenceStudy = z.infer<typeof StudySchema>;
