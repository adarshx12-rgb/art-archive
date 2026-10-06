import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ask, chain } from "./ai";
import type { Env } from "./env";
import { suggestSchemes } from "./palette";
import { perfectPrompt } from "./prompt";
import { concepts } from "./concepts";
import { composePrompt } from "../src/lib/prompt/compose";
import { decodeState } from "../src/lib/prompt/state";

const env = (patch: Partial<Env> = {}): Env =>
  ({
    ASSETS: {} as Fetcher,
    OPENROUTER_API_KEY: "or-test",
    ANTHROPIC_API_KEY: "sk-test",
    OPENROUTER_MODELS: "google/gemini-3.8-flash,anthropic/claude-sonnet-5",
    AI_MODEL: "claude-sonnet-5",
    ...patch,
  }) as Env;

const Out = z.object({ answer: z.string() });
const opts = { system: "s", user: "u", schema: Out, name: "t", effort: "low" as const };

/** A chat-completions reply from OpenRouter. */
const openRouterReply = (content: string, model = "google/gemini-3.8-flash") =>
  new Response(JSON.stringify({ model, choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5, cost: 0.0001 } }), { status: 200 });

/** A Messages API reply from Anthropic. */
const anthropicReply = (text: string) =>
  new Response(
    JSON.stringify({ id: "msg_1", type: "message", role: "assistant", model: "claude-sonnet-5", content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 12, output_tokens: 6 } }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

/** Route fake responses by host; records every call. */
function fakeFetch(handlers: { openrouter?: (body: Record<string, unknown>, n: number) => Response; anthropic?: (n: number) => Response }) {
  const calls: { host: string; body: Record<string, unknown> }[] = [];
  const counts = { openrouter: 0, anthropic: 0 };
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : "{}");
    const body = JSON.parse(typeof raw === "string" ? raw : "{}") as Record<string, unknown>;
    calls.push({ host: url.host, body });
    if (url.host === "openrouter.ai") return handlers.openrouter!(body, counts.openrouter++);
    return handlers.anthropic!(counts.anthropic++);
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("model chain", () => {
  it("lists OpenRouter models in order, then Anthropic directly; skips providers without a key", () => {
    expect(chain(env()).map((t) => `${t.kind}:${t.model}`)).toEqual(["openrouter:google/gemini-3.8-flash", "openrouter:anthropic/claude-sonnet-5", "anthropic:claude-sonnet-5"]);
    expect(chain(env({ OPENROUTER_API_KEY: undefined })).map((t) => t.kind)).toEqual(["anthropic"]);
  });

  it("lets a task use its own OpenRouter model order", () => {
    expect(chain(env(), null, "moonshotai/kimi-k3,google/gemini-3.8-flash").map((t) => t.model)).toEqual(["moonshotai/kimi-k3", "google/gemini-3.8-flash", "claude-sonnet-5"]);
    // An empty task list falls back to the site-wide order.
    expect(chain(env(), null, "").map((t) => t.model)).toEqual(["google/gemini-3.8-flash", "anthropic/claude-sonnet-5", "claude-sonnet-5"]);
  });

  it("sends a task's own model order to OpenRouter", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply('{"answer":"hi"}', "moonshotai/kimi-k3") });
    await ask(env(), { ...opts, models: "moonshotai/kimi-k3,google/gemini-3.8-flash" });
    expect(calls[0]!.body.models).toEqual(["moonshotai/kimi-k3", "google/gemini-3.8-flash"]);
  });

  it("only honours a pinned model when overrides are allowed", () => {
    expect(chain(env(), "openai/gpt-6-luna")).toHaveLength(3);
    expect(chain(env({ ALLOW_MODEL_OVERRIDE: "1" }), "openai/gpt-6-luna")).toEqual([{ kind: "openrouter", model: "openai/gpt-6-luna" }]);
  });

  it("asks OpenRouter with every OpenRouter model at once, a strict schema and require_parameters", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply('{"answer":"hi"}') });
    const r = await ask(env(), opts);
    expect(r).toMatchObject({ data: { answer: "hi" }, model: "google/gemini-3.8-flash", index: 0, usage: { cost: 0.0001 } });
    const body = calls[0]!.body as { models: string[]; provider: unknown; response_format: { json_schema: { strict: boolean; schema: { required: string[]; additionalProperties: boolean } } } };
    expect(body.models).toEqual(["google/gemini-3.8-flash", "anthropic/claude-sonnet-5"]);
    expect(body.provider).toEqual({ require_parameters: true });
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema).toMatchObject({ required: ["answer"], additionalProperties: false });
  });

  it("reports the model OpenRouter actually used", async () => {
    fakeFetch({ openrouter: () => openRouterReply('{"answer":"hi"}', "anthropic/claude-sonnet-5") });
    expect(await ask(env(), opts)).toMatchObject({ model: "anthropic/claude-sonnet-5", index: 1 });
  });

  it("falls back to Anthropic directly when OpenRouter's answer doesn't fit the schema", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply('{"wrong":1}'), anthropic: () => anthropicReply('{"answer":"from claude"}') });
    const r = await ask(env(), opts);
    expect(r).toMatchObject({ data: { answer: "from claude" }, model: "anthropic/claude-sonnet-5", index: 2 });
    expect(calls.map((c) => c.host)).toEqual(["openrouter.ai", "api.anthropic.com"]);
  });

  it("falls back when OpenRouter is rate limited or down", async () => {
    fakeFetch({ openrouter: () => new Response("{}", { status: 429 }), anthropic: () => anthropicReply('{"answer":"ok"}') });
    expect((await ask(env(), opts)).model).toBe("anthropic/claude-sonnet-5");
  });

  it("says so plainly when every model fails", async () => {
    fakeFetch({ openrouter: () => new Response("{}", { status: 500 }), anthropic: () => new Response("{}", { status: 500 }) });
    await expect(ask(env(), opts)).rejects.toThrow(/had a problem/);
  });

  it("explains when nothing is configured", async () => {
    await expect(ask(env({ OPENROUTER_API_KEY: undefined, ANTHROPIC_API_KEY: undefined }), opts)).rejects.toThrow(/isn’t set up/);
  });
});

describe("prompt task", () => {
  const query = "s=gothic&sc=" + encodeURIComponent("person~old knight~0~0~0~0~0~0~1~stand~1");
  const complete = "An old knight standing in the centre, Gothic style, #0F0D0E #5A1520 #A88A4E. Avoid: bright pastels.";

  it("repairs a restyle that introduces new paper and ink colours despite preservation", async () => {
    const fixed = "Restyle in Pop Art using existing source colours only. Outline with the source's darkest existing tone. Avoid: soft gradients.";
    const calls = fakeFetch({ openrouter: (_body, n) => openRouterReply(JSON.stringify({ prompt: n ? fixed : "Pop Art with black ink outlines on yellowed paper. Avoid: soft gradients." })) });
    const result = await perfectPrompt(env(), { query: "s=pop-art&t=restyle&k=colours" });
    expect(result.prompt).toBe(fixed);
    expect(result.warnings).toEqual([]);
    expect(calls).toHaveLength(2);
  });

  it("falls back to the board facts when rewrites keep the words but lose text geometry", async () => {
    const query = "s=gothic&sc=" + encodeURIComponent("text~what the chat~0~1~0~0~0~-20~0.46~stand~1");
    const facts = composePrompt(decodeState(new URLSearchParams(query)).state).prompt;
    fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: 'Gothic style. "what the chat" as a headline with tiny scattered repeats. #0F0D0E #5A1520 #A88A4E. Avoid: pastels.' })) });
    const result = await perfectPrompt(env({ ANTHROPIC_API_KEY: undefined }), { query });
    expect(result.prompt).toBe(facts);
    expect(result.warnings.join(" ")).toContain("changed the placed text layout");
  });

  it("accepts a rewrite that preserves every text placement instruction", async () => {
    const query = "s=gothic&sc=" + encodeURIComponent("text~what the chat~0~1~0~0~0~-20~0.46~stand~1");
    const facts = composePrompt(decodeState(new URLSearchParams(query)).state).prompt;
    const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: facts })) });
    const result = await perfectPrompt(env(), { query });
    expect(result.warnings).toEqual([]);
    expect(result.prompt).toContain("20 degrees counterclockwise");
    expect(calls).toHaveLength(1);
  });

  it("moves to the next model when a valid prompt still leaves something out", async () => {
    // Gemini leaves out the knight twice (first draft and repair); the next model gets it right.
    fakeFetch({
      openrouter: (body, n) =>
        (body.models as string[])[0] === "google/gemini-3.8-flash" && n < 2
          ? openRouterReply(JSON.stringify({ prompt: "A Gothic scene, #0F0D0E #5A1520 #A88A4E. Avoid: bright pastels." }))
          : openRouterReply(JSON.stringify({ prompt: complete }), "anthropic/claude-sonnet-5"),
    });
    const r = await perfectPrompt(env(), { query });
    expect(r.warnings).toEqual([]);
    expect(r.model).toBe("anthropic/claude-sonnet-5");
    expect(r.prompt).toBe(complete);
  });

  it("writes prompts with the prompt task's own model order", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: complete }), "moonshotai/kimi-k3") });
    const r = await perfectPrompt(env({ OPENROUTER_PROMPT_MODELS: "moonshotai/kimi-k3,google/gemini-3.8-flash" }), { query });
    expect(calls[0]!.body.models).toEqual(["moonshotai/kimi-k3", "google/gemini-3.8-flash"]);
    expect(r.model).toBe("moonshotai/kimi-k3");
  });

  it("strips stray characters a model leaves at the end", async () => {
    fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: complete + "”}" })) });
    expect((await perfectPrompt(env(), { query })).prompt).toBe(complete);
  });

  it("keeps a closing quote that belongs to quoted lettering", async () => {
    const quoted = complete.replace("Avoid: bright pastels.", 'Letter exactly "ELSEWHERE"');
    fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: quoted })) });
    expect((await perfectPrompt(env(), { query })).prompt).toBe(quoted);
  });

  it("keeps the first model's prompt when it is complete", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: complete })) });
    const r = await perfectPrompt(env(), { query });
    expect(r).toMatchObject({ warnings: [], model: "google/gemini-3.8-flash" });
    expect(calls).toHaveLength(1);
  });
  describe("with a chosen concept", () => {
    const punk = "s=punk&fm=poster&tx=Night%20Shift&sc=" + encodeURIComponent("person~woman dancing~0~0~0~0~0~0~1~dance~1");
    const brief = {
      title: "Torn in two",
      idea: "The dancer blown up huge and ripped down the middle.",
      hero: { subject: "woman dancing", treatment: "photocopied huge, solid blacks", scale: "cropped at the knees" },
      device: "torn top to bottom just left of centre",
      furniture: ["two strips of masking tape across the tear"],
      type: '"Night Shift" in ransom letters across the tear',
      colour: null,
      finish: "toner specks",
      craft: ["photocopy-blowup", "torn-split", "tape-strips"],
      motion: null,
    };
    const directed = 'Punk poster, 4:5. Xerox white (#F0EEE7) sheet. A woman dancing, photocopied huge in toner black (#0F0F0F), torn down the middle. "Night Shift" in ransom letters with fluoro pink (#FF2E88). Avoid: polished gradients.';

    it("writes it as an art director, with the concept in the input", async () => {
      const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed })) });
      const r = await perfectPrompt(env(), { query: punk, brief });
      expect(r).toMatchObject({ prompt: directed, warnings: [] });
      const sent = JSON.stringify(calls[0]!.body);
      expect(sent).toContain("senior graphic designer");
      expect(sent).toContain("Torn in two");
      // Craft ids reach the model as phrases.
      expect(sent).toContain("high-contrast photocopier blow-up");
    });

    it("gives the art director the style's inspiration when there is one", async () => {
      const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: "Grunge poster. A boxer. Last Round." })) });
      const grunge = "s=grunge&fm=poster&tx=Last%20Round&sc=" + encodeURIComponent("person~boxer~0~0~0~0~0~0~1~stand~1");
      await perfectPrompt(env(), { query: grunge, brief: { ...brief, hero: { ...brief.hero, subject: "boxer" }, type: '"Last Round" scrawled across the top' } });
      const sent = JSON.stringify(calls[0]!.body);
      expect(sent).toContain("digital grunge-texture overlay");
      // Punk has no inspiration yet, so none is sent.
      const punkCalls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed })) });
      await perfectPrompt(env(), { query: punk, brief });
      expect(JSON.stringify(punkCalls[0]!.body)).not.toContain('"inspiration"');
    });

    it("rejects a brief that no longer fits the settings, without calling a model", async () => {
      const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed })) });
      await expect(perfectPrompt(env(), { query: punk, brief: { ...brief, hero: { ...brief.hero, subject: "a dragon" } } })).rejects.toThrow(/no longer fits/);
      expect(calls).toHaveLength(0);
    });

    it("warns about quoted words the visitor didn't type", async () => {
      fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed + ' A badge reading "OPEN LATE".' })) });
      const r = await perfectPrompt(env(), { query: punk, brief });
      expect(r.warnings.join(" ")).toContain("OPEN LATE");
    });

    it("strips filler words", async () => {
      fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: directed.replace("A woman dancing", "A highly detailed woman dancing") })) });
      const r = await perfectPrompt(env(), { query: punk, brief });
      expect(r.prompt).not.toMatch(/highly detailed/i);
      expect(r.prompt).toContain("A woman dancing");
    });
  });
});

describe("colour schemes", () => {
  const scheme = (n: number, name: string) => ({
    name,
    colours: ["#1a1a1a", "#c9a24b", "#f2ead8", "#2f5d50"].slice(0, n).map((hex, i) => ({ hex, name: `colour ${i}` })),
    why: "Suits the style.",
  });

  it("returns one 2, 3 and 4-colour scheme with roles, whatever order the model uses", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ schemes: [scheme(4, "Four"), scheme(2, "Two"), scheme(3, "Three")] })) });
    const out = await suggestSchemes(env(), { style: "art-deco", request: "" });
    expect(out.schemes.map((s) => [s.name, s.colours.length])).toEqual([["Two", 2], ["Three", 3], ["Four", 4]]);
    expect(out.schemes[2]!.colours.map((c) => c.role)).toEqual(["background", "primary", "secondary", "accent"]);
    expect(out.schemes[0]!.colours[0]!.hex).toBe("#1A1A1A");
    expect(JSON.stringify(calls[0]!.body)).toContain("Art Deco");
  });

  it("drops schemes with bad colours and fails when none are left", async () => {
    const bad = { name: "Bad", colours: [{ hex: "nope", name: "x" }, { hex: "#000000", name: "y" }], why: "" };
    fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ schemes: [bad, scheme(3, "Three")] })) });
    expect((await suggestSchemes(env(), { style: "art-deco", request: "" })).schemes.map((s) => s.name)).toEqual(["Three"]);
    fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ schemes: [bad] })) });
    await expect(suggestSchemes(env(), { style: "art-deco", request: "" })).rejects.toThrow(/colour schemes/);
  });
});

describe("concepts task", () => {
  const query = "s=punk&fm=poster&tx=Night%20Shift&sc=" + encodeURIComponent("person~woman dancing~0~0~0~0~0~0~1~dance~1");
  const concept = (title: string, craft: string[], subject = "woman dancing") => ({
    title,
    idea: "An idea.",
    hero: { subject, treatment: "photocopied huge", scale: "cropped at the knees" },
    device: "torn top to bottom",
    furniture: ["two strips of tape"],
    type: '"Night Shift" across the tear',
    colour: null,
    finish: "toner specks",
    craft,
    motion: null,
  });
  const reply = (...cs: unknown[]) => openRouterReply(JSON.stringify({ concepts: cs }));
  const three = [concept("Torn in two", ["photocopy-blowup", "torn-split"]), concept("Through the window", ["halftone-screen", "cutout-window"]), concept("Copier drag", ["one-bit-dither", "motion-sequence"])];

  it("returns three checked concepts with tags in one call", async () => {
    const calls = fakeFetch({ openrouter: () => reply(...three) });
    const r = await concepts(env(), { query, exclude: [] });
    expect(r.concepts.map((c) => c.title)).toEqual(["Torn in two", "Through the window", "Copier drag"]);
    expect(r.concepts[0]!.tags).toEqual(["photocopy", "torn split"]);
    expect(calls).toHaveLength(1);
  });

  it("repairs once and keeps the concepts that passed", async () => {
    const calls = fakeFetch({
      openrouter: (_b, n) => (n === 0 ? reply(concept("Dragon", ["duotone"], "a dragon"), three[0], three[1]) : reply(three[0], three[1], three[2])),
    });
    const r = await concepts(env(), { query, exclude: [] });
    expect(r.concepts.map((c) => c.title)).toEqual(["Torn in two", "Through the window", "Copier drag"]);
    expect(calls).toHaveLength(2);
    expect(JSON.stringify(calls[1]!.body)).toContain("Concept 1: The hero must be");
  });

  it("shows fewer than three when the repair still falls short", async () => {
    fakeFetch({ openrouter: () => reply(three[0], three[0], concept("Dragon", ["duotone"], "a dragon")) });
    expect((await concepts(env(), { query, exclude: [] })).concepts.map((c) => c.title)).toEqual(["Torn in two"]);
  });

  it("fails cleanly when no concept passes", async () => {
    fakeFetch({ openrouter: () => reply(concept("Dragon", ["duotone"], "a dragon")) });
    await expect(concepts(env(), { query, exclude: [] })).rejects.toThrow(/design ideas/);
  });

  it("never repeats a tag on a card", async () => {
    fakeFetch({ openrouter: () => reply(concept("Torn in two", ["photocopy-blowup", "torn-split", "photocopy-contrast"]), three[1], three[2]) });
    const tags = (await concepts(env(), { query, exclude: [] })).concepts[0]!.tags;
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("tells the model which ideas were already shown", async () => {
    const calls = fakeFetch({ openrouter: () => reply(...three) });
    await concepts(env(), { query, exclude: ["Big numeral"] });
    expect(JSON.stringify(calls[0]!.body)).toContain("Big numeral");
  });

  it("accepts restyle concepts that only change the making", async () => {
    const restyle = { ...concept("Dots", ["halftone-screen"]), hero: { subject: null, treatment: "Ben-Day dots everywhere", scale: null }, device: null, furniture: [], type: null, colour: "flat primaries" };
    fakeFetch({ openrouter: () => reply(restyle, { ...restyle, title: "Riso", craft: ["riso-overprint"] }, { ...restyle, title: "Copy", craft: ["photocopy-blowup"] }) });
    expect((await concepts(env(), { query: "s=pop-art&t=restyle", exclude: [] })).concepts).toHaveLength(3);
  });
});
