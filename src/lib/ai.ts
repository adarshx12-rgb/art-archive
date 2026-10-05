import type { Hex, PaletteRole } from "../content/types";
import type { Brief } from "./art/brief";
import type { BuilderState } from "./prompt/state";
import { encodeState } from "./prompt/state";
import type { ShotCamera } from "./scene/camera";
import type { Actor } from "./scene/model";
import type { Drawing } from "./sketch/drawing";

/**
 * Browser side of the /api Worker. Every call returns either data or a
 * message that can be shown as-is.
 */

/** `status` is the HTTP status of a refused request (429: too many AI requests); absent when the server wasn't reached. */
export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

async function post<T>(path: string, body: unknown): Promise<AiResult<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok || !data) return { ok: false, status: res.status, error: data?.error ?? (res.status === 404 ? "This isn’t available on this version of the site." : "Something went wrong. Please try again.") };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Couldn’t reach the server. Check your connection and try again." };
  }
}

export interface SceneReply {
  actors: Actor[];
  camera: { shot: BuilderState["shot"]; angle: BuilderState["angle"]; lens: BuilderState["lens"]; placement: BuilderState["composition"] };
  lighting: BuilderState["lighting"];
  reply: string;
}

/** What the shot camera covers at z = 0, so the model can place subjects in frame. */
function frameAtOrigin(cam: ShotCamera) {
  const dist = Math.max(Math.hypot(cam.eye[0] - cam.target[0], cam.eye[1] - cam.target[1], cam.eye[2] - cam.target[2]), 0.5);
  const half = dist * Math.tan((cam.fov * Math.PI) / 360);
  return {
    halfWidth: half * cam.aspect,
    height: cam.target[1] + half,
    cameraZ: cam.eye[2],
    // Enough for the server to work out what the frame covers further back.
    eyeY: cam.eye[1],
    lookY: cam.target[1],
    slope: Math.tan((cam.fov * Math.PI) / 360),
    aspect: cam.aspect,
  };
}

export function aiScene(state: BuilderState, cam: ShotCamera, mode: "new" | "edit" | "from-prompt", text: string) {
  return post<SceneReply>("/api/scene", {
    mode,
    text,
    scene: state.actors,
    frame: frameAtOrigin(cam),
    style: state.style,
    settings: { shot: state.shot, angle: state.angle, lens: state.lens, composition: state.composition, lighting: state.lighting },
  });
}

export interface SchemesReply {
  /** Up to three schemes, fewest colours first. */
  schemes: { name: string; colours: { hex: Hex; name: string; role: PaletteRole }[]; why: string }[];
}

/** 2, 3 and 4-colour schemes true to the chosen style, optionally for a mood. */
export function aiSchemes(state: BuilderState, request: string) {
  return post<SchemesReply>("/api/schemes", { style: state.style, custom: state.customStyle, request });
}

export interface SwapReply {
  /** Up to three palettes, each keeping the visitor's colour in place. */
  palettes: { name: string; colours: { hex: Hex; name: string; role: PaletteRole }[]; why: string }[];
}

/** Rebuild a palette around one new colour, for one style. */
export function aiSwap(body: { style: string; colours: { hex: Hex; name: string }[]; index: number; hex: Hex }) {
  return post<SwapReply>("/api/swap", body);
}

export interface PromptReply {
  prompt: string;
  warnings: string[];
}

/** The server re-derives every fact from the settings themselves (the share-link form). With a brief, it writes the prompt for that concept. */
export function aiPrompt(state: BuilderState, brief?: Brief) {
  return post<PromptReply>("/api/prompt", { query: encodeState(state).toString(), ...(brief ? { brief } : {}) });
}

export type Concept = Brief & { tags: string[] };

/** Three art-directed concepts for the current settings; `exclude` lists titles already shown. */
export function aiConcepts(state: BuilderState, exclude: string[]) {
  return post<{ concepts: Concept[] }>("/api/concepts", { query: encodeState(state).toString(), exclude: exclude.slice(-12) });
}

export type Idea = { title: string; why: string } & ({ kind: "scene"; instruction: string } | { kind: "words"; slot: string; words: string });

/** Ideas for the template design in progress; the server reads everything from the settings. */
export function aiGuide(state: BuilderState) {
  return post<{ ideas: Idea[] }>("/api/guide", { query: encodeState(state).toString() });
}

/** A storyboard line drawing for a subject the sketch has no shape for. */
export function aiDraw(label: string, detail: "quick" | "full") {
  return post<{ strokes: Drawing | null }>("/api/draw", { label, detail });
}
