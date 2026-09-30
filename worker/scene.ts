import { z } from "zod";
import { angleOptions, compositionOptions, lensOptions, lightingOptions, shotOptions } from "../src/lib/prompt/options";
import { MAX_ACTORS, POSES, REAL_HEIGHT, type Actor } from "../src/lib/scene/model";
import { cleanLabel, clamp } from "../src/lib/sketch/layers";
import type { Glyph } from "../src/lib/sketch/parse";
import { ask } from "./ai";
import type { Env } from "./env";

const GLYPHS = Object.keys(REAL_HEIGHT) as [Glyph, ...Glyph[]];
const ids = <T extends { id: string | number }>(list: readonly T[]) => list.map((o) => String(o.id)) as [string, ...string[]];

// ——— What the browser sends ———

const ActorIn = z.object({
  id: z.string().max(80),
  glyph: z.enum(GLYPHS),
  label: z.string().max(120),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.number(),
  pose: z.enum(POSES.map((p) => p.id) as [string, ...string[]]),
  count: z.number(),
});

export const SceneRequest = z.object({
  /** new: build from a description. edit: change the scene by instruction. from-prompt: rebuild to match an edited prompt. */
  mode: z.enum(["new", "edit", "from-prompt"]),
  text: z.string().min(1).max(3000),
  scene: z.array(ActorIn).max(MAX_ACTORS),
  /** What the shot camera sees at z = 0, so subjects can be placed in frame. */
  frame: z.object({ halfWidth: z.number(), height: z.number(), cameraZ: z.number() }),
  style: z.string().max(80),
});

// ——— What the model returns ———

const SceneOut = z.object({
  subjects: z
    .array(
      z.object({
        id: z.string().describe("The id of an existing subject being kept or changed, or an empty string for a new one."),
        kind: z.enum(GLYPHS).describe("The closest drawable shape. Use 'thing' for anything not in the list."),
        label: z.string().describe("What it is, using only the user's own words and details, e.g. 'old fisherman in a yellow coat'. Never add details the user didn't give."),
        count: z.number().int().describe("How many, drawn side by side (1-6)."),
        x: z.number().describe("Metres; negative is left, positive is right."),
        y: z.number().describe("Metres above the ground; 0 for anything standing on the ground."),
        z: z.number().describe("Metres; positive is towards the camera, negative is further away."),
        turn: z.number().describe("Degrees about the vertical axis. 0 faces the camera, 90 faces screen-right, -90 faces screen-left, 180 faces away."),
        lean: z.number().describe("Degrees of forward (+) or backward (-) lean; usually 0."),
        roll: z.number().describe("Degrees of sideways tilt; usually 0, 90 for something lying on its side."),
        scale: z.number().describe("1 is natural size."),
        pose: z.enum(POSES.map((p) => p.id) as [string, ...string[]]),
      }),
    )
    .describe("Every subject in the finished scene, including unchanged ones."),
  camera: z.object({
    shot: z.enum(ids(shotOptions)),
    angle: z.enum(ids(angleOptions)),
    lens: z.enum(ids(lensOptions)),
    placement: z.enum(ids(compositionOptions)),
  }),
  lighting: z.enum(ids(lightingOptions)),
  reply: z.string().describe("One short sentence telling the user what you set up or changed."),
});

const SYSTEM = `You block out scenes for an image-prompt builder. The user describes a picture; you place its subjects in a simple 3D set so a camera can frame them. Your scene is drawn as a rough storyboard and turned into the final prompt, so place things where the description implies and never add subjects the user didn't ask for.

The set:
- Units are metres. y is up; the ground is y = 0. x runs left (negative) to right (positive).
- The shot camera sits at z = +cameraZ looking towards the origin, so positive z is nearer the camera and negative z is further away. The main subject should usually be nearest the camera, around the origin.
- You are told what the frame covers at z = 0 (halfWidth either side of x = 0, from the ground up to height). Keep subjects inside the frame unless the user wants something cut off. Things further back can spread wider.
- Real sizes at scale 1 (metres tall): person 1.75, child 1.2, dog/cat-sized animal 0.6, horse-sized animal 1.7, car 1.5, house 6, tree 6, castle 18, tower 20, mountain 300. Backdrops (buildings, trees, mountains) belong well behind the people, often 15-300 m away.
- Sky things (sun, moon, planet, cloud, star) go far away and high: z around -600, y around 100-150, unless something sits on or against them (see below).
- Land, ground, grass, fields, farmland and countryside are one wide backdrop: kind "hill", labelled with the user's word (e.g. "land"), placed behind everything else, around z -40 to -80. Things "on the ground" stand at y = 0 in front of it.
- "X on top of Y" / "X on Y": put X directly above Y at the same z and x, its base at Y's top (Y's height is its real size times its scale). When Y is a sky thing, bring Y near enough for both to read (a cloud around z -40 to -80, y 8-15) rather than 600 m away.
- "small" / "tiny" / "big" / "huge" set scale (e.g. 0.5, 0.3, 1.8, 3); "far" / "in the distance" set a more negative z instead.
- turn: 0 faces the camera, 90 faces screen-right, -90 faces screen-left, 180 faces away. Make people face each other, the camera or what they're doing, as the description implies. Animals and vehicles usually side-on (90 or -90).
- Poses: stand, walk, run, sit, dance, lie. Pick from what the subject is doing.
- kind is only the drawn shape. Put the real detail in label using the user's wording ("elderly fisherman in a yellow raincoat", not "person"). Use count for groups ("three crows" is one subject with count 3).
- Text: words in quotes are lettering to show in the picture (a title, sign or slogan). Make each quoted phrase one subject of kind "text" whose label is exactly the quoted words, same spelling and case, without the quotes. Lettering is 0.4 m tall at scale 1; scale it so it reads at its distance and matches what it sits on (e.g. scale 8-15 on a cloud 50 m away). Never make a text subject from words that weren't quoted, and keep existing text subjects' labels unchanged.
- Labels contain only what the user said about that subject. Don't add moods, expressions, clothing, colours, ages or actions they didn't mention ("two children running", not "two laughing children running"). Where the subject is and which way it faces belong in the numbers, not the label.

Camera and light: set shot, angle, lens, placement and lighting only when the user asks for or clearly implies them (e.g. "close-up", "from below", "at night", "golden hour"). Otherwise keep the current values you are given; "auto" and "style" mean "leave it to the style".

Modes:
- new: build the scene from the description. Ignore any current subjects.
- edit: apply the instruction to the current scene. Return every subject, keeping the id and values of anything the instruction doesn't touch. A description of new things ("a cloud with cows under it") adds them to the current scene; it never replaces subjects the user didn't mention.
- from-prompt: the user edited the written prompt; make the scene match it. Keep ids for subjects that are still there.

Reply in one short, plain sentence.`;

type SubjectOut = z.infer<typeof SceneOut>["subjects"][number];

/** Lettering must be words the user quoted (or text already on the sketch), never the model's own. */
function quotedOrKept(label: string, request: string, kept: Set<string>): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const want = norm(label);
  if (!want) return false;
  if (kept.has(want)) return true;
  const quoted = [...request.matchAll(/["“«]([^"”»]+)["”»]/g)].map((m) => norm(m[1]!));
  return quoted.some((q) => q === want);
}

/** Trust nothing: clamp every number, keep only known ids, cap the count, drop invented lettering. */
export function sceneActors(subjects: SubjectOut[], body: Pick<z.infer<typeof SceneRequest>, "mode" | "text" | "scene">): Actor[] {
  const current = body.mode === "new" ? [] : body.scene;
  const known = new Set(current.map((a) => a.id));
  const keptText = new Set(current.filter((a) => a.glyph === "text").map((a) => a.label.toLowerCase().replace(/\s+/g, " ").trim()));
  return subjects
    .filter((s) => s.kind !== "text" || quotedOrKept(s.label, body.text, keptText))
    .slice(0, MAX_ACTORS)
    .map((s, i) => ({
      id: known.has(s.id) ? s.id : `${s.kind}-${Date.now().toString(36)}-${i}`,
      glyph: s.kind,
      label: cleanLabel(s.label) || s.kind,
      position: [clamp(s.x, -5000, 5000), clamp(s.y, -100, 5000), clamp(s.z, -5000, 5000)],
      rotation: [clamp(s.lean, -3600, 3600), clamp(s.turn, -3600, 3600), clamp(s.roll, -3600, 3600)],
      scale: Number.isFinite(s.scale) && s.scale > 0 ? clamp(s.scale, 0.05, 20) : 1,
      pose: s.pose as Actor["pose"],
      count: clamp(Math.round(s.count || 1), 1, 6),
    }));
}

export async function buildScene(
  env: Env,
  body: z.infer<typeof SceneRequest>,
  current: { shot: string; angle: string; lens: string; composition: string; lighting: string },
  override?: string | null,
) {
  const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
  const input = {
    mode: body.mode,
    request: body.text,
    style: body.style,
    frame: { halfWidth: r(body.frame.halfWidth), height: r(body.frame.height), cameraZ: r(body.frame.cameraZ) },
    currentCamera: { shot: current.shot, angle: current.angle, lens: current.lens, placement: current.composition },
    currentLighting: current.lighting,
    currentSubjects:
      body.mode === "new"
        ? []
        : body.scene.map((a) => ({ id: a.id, kind: a.glyph, label: a.label, count: a.count, x: r(a.position[0]), y: r(a.position[1]), z: r(a.position[2]), turn: r(a.rotation[1], 0), lean: r(a.rotation[0], 0), roll: r(a.rotation[2], 0), scale: r(a.scale), pose: a.pose })),
  };
  const { data, usage, model } = await ask(env, { system: SYSTEM, user: JSON.stringify(input), schema: SceneOut, name: "scene", effort: "medium" }, override);
  const actors = sceneActors(data.subjects, body);
  return { actors, camera: data.camera, lighting: data.lighting, reply: data.reply.slice(0, 300), model, usage };
}
