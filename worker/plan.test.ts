import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultState, type BuilderState } from "../src/lib/prompt/state";
import { basePlan } from "../src/lib/plan/plan";
import type { Env } from "./env";
import { planFor } from "./plan";

const env = (patch: Partial<Env> = {}): Env =>
  ({ OPENROUTER_API_KEY: "or-test", OPENROUTER_MODELS: "google/gemini-3.8-flash", OPENROUTER_PLANNER_MODELS: "google/gemini-3.5-flash-lite", ...patch }) as Env;

const reply = (content: unknown) =>
  new Response(JSON.stringify({ model: "google/gemini-3.5-flash-lite", choices: [{ message: { content: JSON.stringify(content) }, finish_reason: "stop" }], usage: { prompt_tokens: 900, completion_tokens: 200, cost: 0.0007 } }), { status: 200 });

/** Each test plans different content, so the memo never carries over between tests. */
const poster = (subject: string): BuilderState => ({ ...defaultState(), format: "poster", subject, text: "Night Market\nEvery Friday 7pm\nwww.nightmarket.my" });

function fake(handler: (body: Record<string, unknown>) => Response) {
  const bodies: Record<string, unknown>[] = [];
  vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    bodies.push(body);
    return handler(body);
  });
  return bodies;
}

afterEach(() => vi.unstubAllGlobals());

describe("planFor", () => {
  it("uses the planner's valid answer, on the planner models", async () => {
    const state = poster("lanterns over food stalls");
    const base = basePlan(state);
    const items = [...base.items].reverse().map(({ ref, role, priority }) => ({ ref, role, priority }));
    const bodies = fake(() => reply({ message: "A weekly night market: come on Friday evening.", items }));
    const { plan, usage, model } = await planFor(env(), state);
    expect(plan.source).toBe("ai");
    expect(plan.message).toBe("A weekly night market: come on Friday evening.");
    expect(plan.items.map((i) => i.ref)).toEqual(items.map((i) => i.ref));
    expect(plan.items.find((i) => i.ref === "Night Market")!.locked).toBe("exact words");
    expect(usage?.cost).toBe(0.0007);
    expect(model).toBe("google/gemini-3.5-flash-lite");
    expect(bodies[0]!.models).toEqual(["google/gemini-3.5-flash-lite"]);
    // The model is told the mined reading order for the design kind.
    expect(JSON.stringify(bodies[0]!.messages)).toContain("readingOrderPrior");
  });

  it("falls back to the rules plan when the answer invents an item", async () => {
    const state = poster("a ferris wheel");
    fake(() => reply({ message: "x", items: [{ ref: "FREE ENTRY", role: "offer", priority: 2 }] }));
    const { plan } = await planFor(env(), state);
    expect(plan).toEqual(basePlan(state));
  });

  it("falls back to the rules plan when the service keeps failing, without throwing", async () => {
    const state = poster("a carousel");
    const bodies = fake(() => new Response(JSON.stringify({ error: { message: "down" } }), { status: 500 }));
    const { plan, usage } = await planFor(env(), state);
    expect(plan).toEqual(basePlan(state));
    expect(usage).toBeNull();
    expect(bodies).toHaveLength(2);
  });

  it("tries once more after a passing hiccup", async () => {
    const state = poster("a helter-skelter");
    const items = basePlan(state).items.map(({ ref, role, priority }) => ({ ref, role, priority }));
    let n = 0;
    fake(() => (n++ ? reply({ message: "m", items }) : new Response(JSON.stringify({ error: { message: "busy" } }), { status: 502 })));
    expect((await planFor(env(), state)).plan.source).toBe("ai");
  });

  it("makes no call when there is nothing to plan", async () => {
    const bodies = fake(() => reply({}));
    const { plan } = await planFor(env(), { ...defaultState(), subject: "" });
    expect(plan.items).toEqual([]);
    expect(bodies).toHaveLength(0);
  });

  it("plans the same content once per isolate", async () => {
    const state = poster("a noodle stall");
    const base = basePlan(state);
    const bodies = fake(() => reply({ message: "m", items: base.items.map(({ ref, role, priority }) => ({ ref, role, priority })) }));
    await planFor(env(), state);
    const again = await planFor(env(), { ...state });
    expect(bodies).toHaveLength(1);
    expect(again.plan.source).toBe("ai");
    // Cached: no new charge.
    expect(again.usage).toBeNull();
  });
});

describe("planFor without a planner model", () => {
  it("uses the rules plan and makes no call", async () => {
    const bodies = fake(() => reply({}));
    const state = poster("a dumpling stand");
    const { plan } = await planFor(env({ OPENROUTER_PLANNER_MODELS: undefined }), state);
    expect(plan).toEqual(basePlan(state));
    expect(bodies).toHaveLength(0);
  });
});
