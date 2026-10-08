import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./env";
import { readImage, ReadRequest } from "./read";

const env = (patch: Partial<Env> = {}): Env =>
  ({ OPENROUTER_API_KEY: "or-key", ANTHROPIC_API_KEY: "an-key", OPENROUTER_MODELS: "google/gemini-3.8-flash", AI_MODEL: "claude-sonnet-5", ...patch }) as Env;

const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const reply = (lines: string[]) =>
  new Response(JSON.stringify({ model: "google/gemini-3.8-flash", choices: [{ message: { content: JSON.stringify({ lines }) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("reading the text in a picture", () => {
  it("sends the picture to a vision model and returns its lines, cleaned", async () => {
    const bodies: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return reply(["TRANSPORTATION • LOGISTICS", "  JOHOR • SINGAPORE ", "", "seyon_services@yahoo.com"]);
    });
    const result = await readImage(env(), { image: PNG });
    expect(result.lines).toEqual(["TRANSPORTATION • LOGISTICS", "JOHOR • SINGAPORE", "seyon_services@yahoo.com"]);
    const user = (bodies[0]!.messages as { role: string; content: unknown }[]).find((m) => m.role === "user")!;
    expect(user.content).toEqual([expect.objectContaining({ type: "text" }), { type: "image_url", image_url: { url: PNG } }]);
  });

  it("joins a line its box wrapped, given away by a trailing separator", async () => {
    vi.stubGlobal("fetch", async () => reply(["TRANSPORTATION • LOGISTICS •", "WAREHOUSING", "39A, Jalan Eko Botanik 3/4", "Taman Eko Botanik"]));
    const result = await readImage(env(), { image: PNG });
    expect(result.lines).toEqual(["TRANSPORTATION • LOGISTICS • WAREHOUSING", "39A, Jalan Eko Botanik 3/4", "Taman Eko Botanik"]);
  });

  it("accepts only a picture as a data URL", () => {
    expect(ReadRequest.safeParse({ image: PNG }).success).toBe(true);
    expect(ReadRequest.safeParse({ image: "https://example.com/a.png" }).success).toBe(false);
    expect(ReadRequest.safeParse({ image: "data:text/html;base64,PGgxPg==" }).success).toBe(false);
  });
});
