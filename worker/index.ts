import { z } from "zod";
import { angleOptions, compositionOptions, lensOptions, lightingOptions, shotOptions } from "../src/lib/prompt/options";
import { AiError } from "./ai";
import { concepts, ConceptsRequest } from "./concepts";
import type { Env } from "./env";
import { SchemesRequest, suggestSchemes } from "./palette";
import { draw, DrawRequest } from "./draw";
import { guide, GuideRequest } from "./guide";
import { perfectPrompt, PromptRequest } from "./prompt";
import { READ_IMAGE_MAX, readImage, ReadRequest } from "./read";
import { buildScene, SceneRequest } from "./scene";
import { swapColour, SwapRequest } from "./swap";

/**
 * The site's small backend. Static files are served by Cloudflare directly;
 * only /api/* reaches this code (see wrangler.jsonc).
 *
 *   POST /api/scene    text or instruction  -> 3D scene
 *   POST /api/schemes  style (+ mood)       -> a 2, 3 and 4-colour scheme
 *   POST /api/concepts builder settings     -> three art-directed design concepts
 *   POST /api/prompt   builder settings     -> checked, polished prompt
 *   POST /api/guide    builder settings     -> ideas for the template design
 *   POST /api/draw     a subject's name     -> a storyboard line drawing of it
 *   POST /api/swap     palette + one colour -> three palettes rebuilt around it
 *   POST /api/read     a picture            -> the lines of text in it
 */

const MAX_BODY = 32_000;
/** Only a picture to read may be larger. */
const maxBody = (path: string) => (path === "/api/read" ? READ_IMAGE_MAX + 1_000 : MAX_BODY);
const ids = <T extends { id: string | number }>(list: readonly T[]) => list.map((o) => String(o.id)) as [string, ...string[]];

const SceneBody = SceneRequest.extend({
  settings: z.object({
    shot: z.enum(ids(shotOptions)),
    angle: z.enum(ids(angleOptions)),
    lens: z.enum(ids(lensOptions)),
    composition: z.enum(ids(compositionOptions)),
    lighting: z.enum(ids(lightingOptions)),
  }),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const fail = (message: string, status: number) => json({ error: message }, status);

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  // Local evals can pin one model (honoured only when ALLOW_MODEL_OVERRIDE is "1").
  const override = request.headers.get("x-ai-model");
  if (request.method !== "POST") return fail("Use POST.", 405);

  // Only this site's own pages may call the API.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== url.host) return fail("Not allowed.", 403);

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBody(url.pathname)) return fail("Request too large.", 413);

  if (env.AI_LIMIT) {
    const who = request.headers.get("cf-connecting-ip") ?? "local";
    const { success } = await env.AI_LIMIT.limit({ key: who });
    if (!success) return fail("Too many AI requests. Wait a minute and try again.", 429);
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > maxBody(url.pathname)) return fail("Request too large.", 413);
    raw = JSON.parse(text);
  } catch {
    return fail("Send JSON.", 400);
  }

  switch (url.pathname) {
    case "/api/scene": {
      const body = SceneBody.safeParse(raw);
      if (!body.success) return fail("That scene request isn’t valid.", 400);
      return json(await buildScene(env, body.data, body.data.settings, override));
    }
    case "/api/schemes": {
      const body = SchemesRequest.safeParse(raw);
      if (!body.success) return fail("That colour scheme request isn’t valid.", 400);
      return json(await suggestSchemes(env, body.data, override));
    }
    case "/api/concepts": {
      const body = ConceptsRequest.safeParse(raw);
      if (!body.success) return fail("That request isn’t valid.", 400);
      return json(await concepts(env, body.data, override));
    }
    case "/api/prompt": {
      const body = PromptRequest.safeParse(raw);
      if (!body.success) return fail("That prompt request isn’t valid.", 400);
      return json(await perfectPrompt(env, body.data, override));
    }
    case "/api/guide": {
      const body = GuideRequest.safeParse(raw);
      if (!body.success) return fail("That request isn’t valid.", 400);
      return json(await guide(env, body.data, override));
    }
    case "/api/draw": {
      const body = DrawRequest.safeParse(raw);
      if (!body.success) return fail("That drawing request isn’t valid.", 400);
      return json(await draw(env, body.data, override));
    }
    case "/api/swap": {
      const body = SwapRequest.safeParse(raw);
      if (!body.success) return fail("That colour swap request isn’t valid.", 400);
      return json(await swapColour(env, body.data, override));
    }
    case "/api/read": {
      const body = ReadRequest.safeParse(raw);
      if (!body.success) return fail("That picture can’t be read. Use a PNG, JPEG or WebP image.", 400);
      return json(await readImage(env, body.data, override));
    }
    default:
      return fail("Not found.", 404);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    try {
      return await handle(request, env);
    } catch (e) {
      if (e instanceof AiError) return fail(e.message, e.status);
      console.error(e);
      return fail("Something went wrong. Please try again.", 500);
    }
  },
} satisfies ExportedHandler<Env>;
