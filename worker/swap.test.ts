import { afterEach, describe, expect, it, vi } from "vitest";
import { palettes } from "../src/content/palettes";
import type { Env } from "./env";
import { SwapRequest, swapColour } from "./swap";

const env = (): Env => ({ ASSETS: {} as Fetcher, OPENROUTER_API_KEY: "or-test", OPENROUTER_MODELS: "google/gemini-3.8-flash" }) as Env;

const reply = (content: unknown) =>
  new Response(
    JSON.stringify({ model: "google/gemini-3.8-flash", choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5 } }),
    { status: 200 },
  );

/** Every request answers with `content`; returns the request bodies sent. */
function fake(content: unknown) {
  const bodies: string[] = [];
  vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ""));
    return reply(content);
  });
  return bodies;
}

afterEach(() => vi.unstubAllGlobals());

const base = {
  style: "pop-art",
  colours: [
    { hex: "#FFF4D6", name: "cream" },
    { hex: "#E8452C", name: "tomato" },
    { hex: "#1B1B1B", name: "ink" },
    { hex: "#F28C28", name: "orange" },
  ],
  index: 3,
  hex: "#1F5FD6",
};
const pal = (name: string, hexes: string[]) => ({ name, colours: hexes.map((hex, i) => ({ hex, name: `c${i}` })), why: "Works." });

describe("swap request", () => {
  it("accepts a valid body and rejects a bad index, size or hex", () => {
    expect(SwapRequest.safeParse(base).success).toBe(true);
    expect(SwapRequest.safeParse({ ...base, index: 4 }).success).toBe(false);
    expect(SwapRequest.safeParse({ ...base, colours: base.colours.slice(0, 1), index: 0 }).success).toBe(false);
    expect(SwapRequest.safeParse({ ...base, hex: "blue" }).success).toBe(false);
  });
});

describe("swapColour", () => {
  it("keeps the visitor's colour at its index even when the model changes it, and assigns roles", async () => {
    const bodies = fake({ palettes: [pal("A", ["#FFFFFF", "#111111", "#EEEEEE", "#0000ff"]), pal("B", ["#F0F0F0", "#222222", "#DDDDDD", "#1F5FD6"])] });
    const out = await swapColour(env(), base);
    expect(out.palettes.map((p) => p.colours[3]!.hex)).toEqual(["#1F5FD6", "#1F5FD6"]);
    expect(out.palettes[0]!.colours.map((c) => c.role)).toEqual(["background", "primary", "secondary", "accent"]);
    expect(bodies[0]).toContain("Pop Art");
    expect(bodies[0]).toContain("#1F5FD6");
  });

  it("shows the model the style's own curated palettes as examples of good taste", async () => {
    const bodies = fake({ palettes: [pal("A", ["#FFFFFF", "#111111", "#EEEEEE", "#1F5FD6"])] });
    await swapColour(env(), base);
    const own = palettes.filter((p) => p.suits.includes("pop-art"));
    expect(own.length).toBeGreaterThan(0);
    for (const p of own.slice(0, 6)) expect(bodies[0]).toContain(p.name);
  });

  it("works when the new colour equals the old one", async () => {
    fake({ palettes: [pal("A", ["#FFFFFF", "#111111", "#EEEEEE", "#F28C28"])] });
    const out = await swapColour(env(), { ...base, hex: "#f28c28" });
    expect(out.palettes[0]!.colours[3]!.hex).toBe("#F28C28");
  });

  it("drops wrong-size, bad-hex and duplicate palettes; keeps at most three", async () => {
    fake({
      palettes: [
        pal("Short", ["#FFFFFF", "#111111"]),
        pal("Bad", ["nope", "#111111", "#EEEEEE", "#1F5FD6"]),
        pal("One", ["#FFFFFF", "#111111", "#EEEEEE", "#1F5FD6"]),
        pal("Dup", ["#ffffff", "#111111", "#eeeeee", "#1f5fd6"]),
        pal("Two", ["#FAFAFA", "#121212", "#ECECEC", "#1F5FD6"]),
        pal("Three", ["#F5F5F5", "#131313", "#EBEBEB", "#1F5FD6"]),
        pal("Four", ["#F1F1F1", "#141414", "#EAEAEA", "#1F5FD6"]),
      ],
    });
    expect((await swapColour(env(), base)).palettes.map((p) => p.name)).toEqual(["One", "Two", "Three"]);
  });

  it("fails clearly when nothing valid comes back", async () => {
    fake({ palettes: [pal("Short", ["#FFFFFF"])] });
    await expect(swapColour(env(), base)).rejects.toThrow(/around that colour/);
  });

  it("rejects an unknown style", async () => {
    fake({ palettes: [] });
    await expect(swapColour(env(), { ...base, style: "no-such-style" })).rejects.toThrow(/style/);
  });
});
