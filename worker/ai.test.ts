import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ask, chain } from "./ai";
import type { Env } from "./env";
import { perfectPrompt } from "./prompt";

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

  it("keeps the first model's prompt when it is complete", async () => {
    const calls = fakeFetch({ openrouter: () => openRouterReply(JSON.stringify({ prompt: complete })) });
    const r = await perfectPrompt(env(), { query });
    expect(r).toMatchObject({ warnings: [], model: "google/gemini-3.8-flash" });
    expect(calls).toHaveLength(1);
  });
});
