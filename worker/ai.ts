import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Env } from "./env";

/**
 * The one place that talks to model providers. Every task asks for JSON
 * matching a Zod schema and gets a validated answer back, from the first
 * model in the chain that produces one:
 *
 *   1. OpenRouter, trying OPENROUTER_MODELS in order (OpenRouter itself
 *      switches on outages and rate limits);
 *   2. Anthropic directly (AI_MODEL), so an OpenRouter outage doesn't take
 *      the AI features down.
 *
 * A reply that isn't valid JSON for the schema also moves on to the next
 * model. Callers can ask to start further down the chain (`from`) when a
 * valid answer still failed their own checks.
 */

export type Effort = "low" | "medium" | "high";

export interface AskOptions<T extends z.ZodType> {
  system: string;
  /** The task input, as plain text (usually JSON). */
  user: string;
  /** Pictures sent with the input, as data URLs (vision models only). */
  images?: string[];
  schema: T;
  /** Short name for the schema (OpenRouter requires one). */
  name: string;
  effort: Effort;
  /** Skip models before this position in the chain. */
  from?: number;
  /** Milliseconds to wait for one model. Visitor-facing calls keep the default; offline scripts can wait longer. */
  timeout?: number;
  /** Output token cap, thinking included. */
  maxTokens?: number;
  /** This task's own comma-separated OpenRouter model order; empty uses OPENROUTER_MODELS. */
  models?: string;
}

export interface Usage {
  input: number;
  output: number;
  cached: number;
  /** US dollars, when the provider reports it. */
  cost?: number;
}

/** Sum two calls' usage (cost only when either reported it). */
export const addUsage = (a: Usage, b: Usage): Usage => ({
  input: a.input + b.input,
  output: a.output + b.output,
  cached: a.cached + b.cached,
  ...(a.cost !== undefined || b.cost !== undefined ? { cost: (a.cost ?? 0) + (b.cost ?? 0) } : {}),
});

export interface AskResult<T> {
  data: T;
  usage: Usage;
  /** Which model answered, e.g. "google/gemini-3.8-flash". */
  model: string;
  /** Its position in the chain, for `from` on a retry. */
  index: number;
}

/** A failure we can explain to the visitor, with the HTTP status to send. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Worth trying the next model. */
    readonly retryable = true,
  ) {
    super(message);
  }
}

type Target = { kind: "openrouter"; model: string } | { kind: "anthropic"; model: string };

const list = (s?: string) =>
  (s ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

/**
 * The models to try, in order. A task can bring its own OpenRouter order (models);
 * a dev-only override pins a single model (for comparing models in evals).
 */
export function chain(env: Env, override?: string | null, models?: string): Target[] {
  if (override && env.ALLOW_MODEL_OVERRIDE === "1") {
    return [override.includes("/") ? { kind: "openrouter", model: override } : { kind: "anthropic", model: override }];
  }
  const targets: Target[] = [];
  const order = list(models).length ? list(models) : list(env.OPENROUTER_MODELS);
  if (env.OPENROUTER_API_KEY) for (const model of order) targets.push({ kind: "openrouter", model });
  if (env.ANTHROPIC_API_KEY) targets.push({ kind: "anthropic", model: env.AI_MODEL || "claude-sonnet-5" });
  return targets;
}

export async function ask<T extends z.ZodType>(env: Env, opts: AskOptions<T>, override?: string | null): Promise<AskResult<z.infer<T>>> {
  const targets = chain(env, override, opts.models);
  if (!targets.length) throw new AiError("This isn’t set up on this server yet.", 503, false);
  let last: AiError | null = null;
  let i = opts.from ?? 0;
  while (i < targets.length) {
    const t = targets[i]!;
    try {
      if (t.kind === "openrouter") {
        // Hand OpenRouter every consecutive OpenRouter model at once so it can switch on outages itself.
        let j = i;
        while (j < targets.length && targets[j]!.kind === "openrouter") j++;
        const group = targets.slice(i, j).map((x) => x.model);
        try {
          const r = await openRouter(env, opts, group);
          const used = group.indexOf(r.model);
          return { ...r, index: i + (used < 0 ? 0 : used) };
        } catch (e) {
          if (!(e instanceof AiError) || !e.retryable) throw e;
          last = e;
          i = j;
          continue;
        }
      }
      const r = await anthropic(env, opts, t.model);
      return { ...r, index: i };
    } catch (e) {
      if (!(e instanceof AiError) || !e.retryable) throw e;
      last = e;
      i++;
    }
  }
  throw last ?? new AiError("No AI model is available right now.", 503, false);
}

// ——— OpenRouter (OpenAI-style chat completions) ———

/** JSON Schema in the strict form providers expect: every property required, no extra keys. */
function strictSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (n.type === "object" && n.properties && typeof n.properties === "object") {
      n.additionalProperties = false;
      n.required = Object.keys(n.properties as object);
    }
    Object.values(n).forEach((v) => (Array.isArray(v) ? v.forEach(walk) : walk(v)));
  };
  walk(json);
  return json;
}

interface ChatResponse {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string; error?: { message?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number; prompt_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string; code?: number };
}

async function openRouter<T extends z.ZodType>(env: Env, opts: AskOptions<T>, models: string[]) {
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "content-type": "application/json",
        "x-title": "FORM / FIELD",
        ...(env.SITE_URL ? { "http-referer": env.SITE_URL } : {}),
      },
      body: JSON.stringify({
        models,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.images?.length ? [{ type: "text", text: opts.user }, ...opts.images.map((url) => ({ type: "image_url", image_url: { url } }))] : opts.user },
        ],
        response_format: { type: "json_schema", json_schema: { name: opts.name, strict: true, schema: strictSchema(opts.schema) } },
        // Only use providers that honour the schema.
        provider: { require_parameters: true },
        reasoning: { effort: opts.effort },
        max_tokens: opts.maxTokens ?? 16000,
      }),
      signal: AbortSignal.timeout(opts.timeout ?? 45_000),
    });
  } catch {
    throw new AiError("Couldn’t reach the AI service. Try again.", 504);
  }
  // A timeout can also land while the body is still arriving; say so rather than "empty".
  let body: ChatResponse;
  try {
    body = (await res.json()) as ChatResponse;
  } catch {
    throw new AiError(res.ok ? "The AI took too long to answer. Try again." : "The AI service had a problem. Try again.", 504);
  }
  if (res.status === 401 || res.status === 403) throw new AiError("This isn’t set up correctly on this server.", 503);
  if (res.status === 402) throw new AiError("The AI account is out of credit.", 503);
  if (res.status === 429) throw new AiError("The AI is busy right now. Try again in a minute.", 429);
  // Some providers in a chain cannot see images; the request still deserves an answer from the text.
  if (!res.ok && opts.images?.length && /image/i.test(body.error?.message ?? "")) return openRouter(env, { ...opts, images: undefined }, models);
  if (!res.ok || body.error) throw new AiError("The AI service had a problem. Try again.", 502);

  const choice = body.choices?.[0];
  if (choice?.error) throw new AiError("The AI service had a problem. Try again.", 502);
  if (choice?.finish_reason === "length") throw new AiError("The answer was too long. Try a simpler request.", 502);
  const data = parseReply(choice?.message?.content, opts.schema);
  return {
    data,
    model: body.model ?? models[0]!,
    usage: {
      input: body.usage?.prompt_tokens ?? 0,
      output: body.usage?.completion_tokens ?? 0,
      cached: body.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      ...(typeof body.usage?.cost === "number" ? { cost: body.usage.cost } : {}),
    },
  };
}

/** Read the model's JSON and check it against the schema; a bad reply moves on to the next model. */
function parseReply<T extends z.ZodType>(content: string | null | undefined, schema: T): z.infer<T> {
  if (!content) throw new AiError("The model’s answer was empty.", 502);
  let raw: unknown;
  try {
    raw = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AiError("The model’s answer couldn’t be read. Please try again.", 502);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new AiError("The model’s answer didn’t fit the expected format.", 502);
  return parsed.data;
}

// ——— Anthropic (direct, last resort) ———

/** A data URL as an Anthropic image block. */
function imageBlock(url: string) {
  const [, mediaType = "image/png", data = ""] = url.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.*)$/) ?? [];
  return { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data } };
}

async function anthropic<T extends z.ZodType>(env: Env, opts: AskOptions<T>, model: string) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: opts.timeout ?? 60_000 });
  try {
    const response = await client.messages.parse({
      model,
      max_tokens: opts.maxTokens ?? 16000,
      // The instructions are identical on every call, so cache them.
      cache_control: { type: "ephemeral" },
      system: opts.system,
      messages: [{ role: "user", content: opts.images?.length ? [...opts.images.map(imageBlock), { type: "text" as const, text: opts.user }] : opts.user }],
      output_config: { format: zodOutputFormat(opts.schema), effort: opts.effort },
    });
    if (response.stop_reason === "refusal") throw new AiError("The model declined this request. Try describing it differently.", 422, false);
    if (response.stop_reason === "max_tokens") throw new AiError("The answer was too long. Try a simpler request.", 502);
    if (!response.parsed_output) throw new AiError("The model’s answer couldn’t be read. Please try again.", 502);
    return {
      data: response.parsed_output as z.infer<T>,
      model: `anthropic/${model}`,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI is busy right now. Try again in a minute.", 429);
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new AiError("This isn’t set up correctly on this server.", 503);
    if (e instanceof Anthropic.BadRequestError) throw new AiError("That request couldn’t be processed.", 400, false);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("Couldn’t reach the AI service. Try again.", 504);
    if (e instanceof Anthropic.APIError) throw new AiError("The AI service had a problem. Try again.", 502);
    throw e;
  }
}
