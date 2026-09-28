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

/** Where the subject sits in the frame. Shot size and angle live in the camera options below. */
export const compositionOptions = [
  { id: "style", label: "Style default", phrase: "" },
  { id: "centred", label: "Centred subject", phrase: "the subject centred with balanced space around it" },
  { id: "thirds", label: "Rule of thirds", phrase: "the subject placed on a rule-of-thirds line with open space opposite" },
  { id: "symmetrical", label: "Symmetrical", phrase: "a strictly symmetrical, frontal arrangement" },
] as const satisfies readonly Option<string>[];
/** Old share links used these framing values; they now map to a shot size or angle. */
export const legacyCompositions: Record<string, { shot?: ShotId; angle?: AngleId }> = {
  "close-up": { shot: "close-up" },
  wide: { shot: "wide" },
  overhead: { angle: "overhead" },
  "low-angle": { angle: "low" },
};
export type CompositionId = (typeof compositionOptions)[number]["id"];

export const shotOptions = [
  { id: "auto", label: "Auto", phrase: "" },
  { id: "extreme-wide", label: "Extreme wide", phrase: "an extreme wide shot where the subject is small in a vast setting" },
  { id: "wide", label: "Wide", phrase: "a wide shot showing the subject within its surroundings" },
  { id: "full", label: "Full shot", phrase: "a full shot showing the subject from head to toe" },
  { id: "medium", label: "Medium", phrase: "a medium shot framing the subject from the waist up" },
  { id: "close-up", label: "Close-up", phrase: "a close-up on the face and shoulders" },
  { id: "extreme-close-up", label: "Extreme close-up", phrase: "an extreme close-up on a single detail" },
] as const satisfies readonly Option<string>[];
export type ShotId = (typeof shotOptions)[number]["id"];

export const angleOptions = [
  { id: "auto", label: "Auto", phrase: "" },
  { id: "eye", label: "Eye level", phrase: "at eye level" },
  { id: "low", label: "Low angle", phrase: "from a low angle looking up" },
  { id: "high", label: "High angle", phrase: "from a high angle looking down" },
  { id: "overhead", label: "Overhead", phrase: "from directly overhead, looking straight down" },
  { id: "dutch", label: "Dutch tilt", phrase: "with a tilted, off-kilter Dutch angle" },
] as const satisfies readonly Option<string>[];
export type AngleId = (typeof angleOptions)[number]["id"];

export const lensOptions = [
  { id: "auto", label: "Auto", phrase: "" },
  { id: "14", label: "14mm ultra-wide", phrase: "a 14mm ultra-wide lens with strong perspective" },
  { id: "24", label: "24mm wide", phrase: "a 24mm wide-angle lens" },
  { id: "35", label: "35mm", phrase: "a 35mm lens with natural perspective" },
  { id: "50", label: "50mm", phrase: "a 50mm lens, close to how the eye sees" },
  { id: "85", label: "85mm portrait", phrase: "an 85mm portrait lens with a softly blurred background" },
  { id: "135", label: "135mm telephoto", phrase: "a 135mm telephoto lens that compresses depth" },
] as const satisfies readonly Option<string>[];
export type LensId = (typeof lensOptions)[number]["id"];

export const genreOptions = [
  { id: "auto", label: "Auto", phrase: "" },
  { id: "drama", label: "Drama", phrase: "the grounded, emotional tone of a drama" },
  { id: "thriller", label: "Thriller", phrase: "the tense, suspenseful tone of a thriller" },
  { id: "horror", label: "Horror", phrase: "the unsettling, ominous tone of a horror film" },
  { id: "sci-fi", label: "Sci-fi", phrase: "the speculative, otherworldly tone of science fiction" },
  { id: "fantasy", label: "Fantasy", phrase: "the enchanted, mythic tone of fantasy" },
  { id: "romance", label: "Romance", phrase: "the tender, intimate tone of a romance" },
  { id: "comedy", label: "Comedy", phrase: "the bright, playful tone of a comedy" },
  { id: "noir", label: "Noir", phrase: "the moody, shadowy tone of film noir" },
  { id: "documentary", label: "Documentary", phrase: "the observational, unposed feel of a documentary" },
  { id: "commercial", label: "Commercial", phrase: "the polished, aspirational feel of an advertisement" },
  { id: "music-video", label: "Music video", phrase: "the bold, rhythmic energy of a music video" },
] as const satisfies readonly Option<string>[];
export type GenreId = (typeof genreOptions)[number]["id"];

export const eraOptions = [
  { id: "auto", label: "Auto", phrase: "" },
  { id: "1920s", label: "1920s", phrase: "the 1920s" },
  { id: "1950s", label: "1950s", phrase: "the 1950s" },
  { id: "1970s", label: "1970s", phrase: "the 1970s" },
  { id: "1980s", label: "1980s", phrase: "the 1980s" },
  { id: "1990s", label: "1990s", phrase: "the 1990s" },
  { id: "2000s", label: "2000s", phrase: "the 2000s" },
  { id: "today", label: "Today", phrase: "the present day" },
  { id: "future", label: "Future", phrase: "the near future" },
] as const satisfies readonly Option<string>[];
export type EraId = (typeof eraOptions)[number]["id"];

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
