/**
 * Builder option vocabularies. Each option has a UI label and the exact
 * phrase the prompt template inserts. Keeping phrases here (not in
 * components) keeps prompt output deterministic and testable.
 */

export interface Option<T extends string | number> {
  id: T;
  label: string;
  phrase: string;
}

export const outputs = ["image", "video"] as const;
export type Output = (typeof outputs)[number];

export const tasks = ["create", "restyle"] as const;
export type Task = (typeof tasks)[number];

export const intensities = ["subtle", "balanced", "strong"] as const;
export type Intensity = (typeof intensities)[number];

export const paletteModes = ["style", "curated", "custom"] as const;
export type PaletteMode = (typeof paletteModes)[number];

export const compositionOptions = [
  { id: "style", label: "Style default", phrase: "" },
  { id: "centred", label: "Centred subject", phrase: "the subject centred with balanced space around it" },
  { id: "thirds", label: "Rule of thirds", phrase: "the subject placed on a rule-of-thirds line with open space opposite" },
  { id: "symmetrical", label: "Symmetrical", phrase: "a strictly symmetrical, frontal arrangement" },
  { id: "close-up", label: "Close-up", phrase: "a tight close-up that fills the frame with the subject" },
  { id: "wide", label: "Wide / environmental", phrase: "a wide shot showing the subject within its surroundings" },
  { id: "overhead", label: "Overhead / flat lay", phrase: "a top-down overhead view" },
  { id: "low-angle", label: "Low angle", phrase: "a low camera angle looking up at the subject" },
] as const satisfies readonly Option<string>[];
export type CompositionId = (typeof compositionOptions)[number]["id"];

export const aspectOptions = [
  { id: "1:1", label: "1:1 Square", phrase: "a square 1:1 frame" },
  { id: "4:5", label: "4:5 Portrait", phrase: "a 4:5 portrait frame" },
  { id: "2:3", label: "2:3 Portrait", phrase: "a 2:3 portrait frame" },
  { id: "9:16", label: "9:16 Vertical", phrase: "a tall 9:16 vertical frame" },
  { id: "3:2", label: "3:2 Landscape", phrase: "a 3:2 landscape frame" },
  { id: "16:9", label: "16:9 Widescreen", phrase: "a 16:9 widescreen frame" },
  { id: "21:9", label: "21:9 Cinematic", phrase: "an ultra-wide 21:9 cinematic frame" },
] as const satisfies readonly Option<string>[];
export type AspectId = (typeof aspectOptions)[number]["id"];

export const lightingOptions = [
  { id: "style", label: "Style default", phrase: "" },
  { id: "soft-daylight", label: "Soft daylight", phrase: "soft, diffused daylight" },
  { id: "golden-hour", label: "Golden hour", phrase: "warm, low golden-hour sunlight" },
  { id: "studio", label: "Studio", phrase: "clean, controlled studio lighting" },
  { id: "overcast", label: "Overcast", phrase: "flat, even overcast light" },
  { id: "night", label: "Night / artificial", phrase: "night-time scene lit by artificial light sources" },
  { id: "candlelight", label: "Candle / firelight", phrase: "warm, flickering candle or firelight" },
  { id: "hard-flash", label: "Hard flash", phrase: "direct on-camera flash with hard shadows" },
  { id: "backlit", label: "Backlit", phrase: "strong backlight creating rim light and silhouettes" },
] as const satisfies readonly Option<string>[];
export type LightingId = (typeof lightingOptions)[number]["id"];

export const preserveOptions = [
  { id: "identity", label: "Identity & faces", phrase: "the identity, facial features and expressions of any people", videoOnly: false },
  { id: "pose", label: "Poses & gestures", phrase: "poses and gestures", videoOnly: false },
  { id: "composition", label: "Composition & framing", phrase: "the original composition, framing and aspect ratio", videoOnly: false },
  { id: "proportions", label: "Object shapes", phrase: "the shapes and proportions of the main objects", videoOnly: false },
  { id: "background", label: "Background", phrase: "the background and setting", videoOnly: false },
  { id: "text", label: "Text & logos", phrase: "all existing text and logos, legible and unchanged", videoOnly: false },
  { id: "colours", label: "Original colours", phrase: "the original colour scheme", videoOnly: false },
  { id: "timing", label: "Motion & timing", phrase: "the original motion, timing and camera movement", videoOnly: true },
] as const;
export type PreserveId = (typeof preserveOptions)[number]["id"];

export const durationOptions = [
  { id: 4, label: "4 s", phrase: "about 4 seconds" },
  { id: 6, label: "6 s", phrase: "about 6 seconds" },
  { id: 8, label: "8 s", phrase: "about 8 seconds" },
  { id: 10, label: "10 s", phrase: "about 10 seconds" },
  { id: 15, label: "15 s", phrase: "about 15 seconds" },
] as const satisfies readonly Option<number>[];
export type Duration = (typeof durationOptions)[number]["id"];

export const cameraOptions = [
  { id: "static", label: "Locked-off", phrase: "a static, locked-off camera" },
  { id: "push-in", label: "Slow push-in", phrase: "a slow, steady push-in towards the subject" },
  { id: "pull-back", label: "Pull back", phrase: "a slow pull-back revealing more of the scene" },
  { id: "pan", label: "Pan", phrase: "a smooth horizontal pan" },
  { id: "orbit", label: "Orbit", phrase: "a slow orbit around the subject" },
  { id: "tracking", label: "Tracking", phrase: "a tracking shot moving alongside the subject" },
  { id: "crane", label: "Crane / rise", phrase: "a rising crane move" },
  { id: "handheld", label: "Handheld", phrase: "a gently handheld camera with natural sway" },
] as const satisfies readonly Option<string>[];
export type CameraId = (typeof cameraOptions)[number]["id"];

export const movementOptions = [
  { id: "still", label: "Almost still", phrase: "the subject stays almost still; only small ambient details move" },
  { id: "subtle", label: "Subtle", phrase: "subtle, natural subject movement" },
  { id: "natural", label: "Natural", phrase: "natural, continuous subject movement" },
  { id: "dynamic", label: "Dynamic", phrase: "energetic, dynamic subject movement" },
] as const satisfies readonly Option<string>[];
export type MovementId = (typeof movementOptions)[number]["id"];

export function findOption<T extends { id: unknown }>(list: readonly T[], id: unknown): T | undefined {
  return list.find((o) => o.id === id);
}
