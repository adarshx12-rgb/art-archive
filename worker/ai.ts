import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { Env } from "./env";

/**
 * The one place that talks to a model provider. Every task asks for JSON
 * matching a Zod schema; the SDK validates the reply before we use it.
 * To try another provider, add a function with the same shape here.
 */

export type Effort = "low" | "medium" | "high";

export interface AskOptions<T extends z.ZodType> {
  system: string;
  /** The task input, as plain text (usually JSON). */
  user: string;
  schema: T;
  effort: Effort;
}

export interface AskResult<T> {
  data: T;
  usage: { input: number; output: number; cached: number };
}

/** A failure we can explain to the visitor, with the HTTP status to send. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function ask<T extends z.ZodType>(env: Env, opts: AskOptions<T>): Promise<AskResult<z.infer<T>>> {
  if (!env.ANTHROPIC_API_KEY) throw new AiError("AI isn’t set up on this server yet.", 503);
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 });
  try {
    const response = await client.messages.parse({
      model: env.AI_MODEL || "claude-sonnet-5",
      max_tokens: 16000,
      // The instructions are identical on every call, so cache them.
      cache_control: { type: "ephemeral" },
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: { format: zodOutputFormat(opts.schema), effort: opts.effort },
    });
    if (response.stop_reason === "refusal") throw new AiError("The model declined this request. Try describing it differently.", 422);
    if (response.stop_reason === "max_tokens") throw new AiError("The answer was too long. Try a simpler request.", 502);
    if (!response.parsed_output) throw new AiError("The model’s answer couldn’t be read. Please try again.", 502);
    return {
      data: response.parsed_output as z.infer<T>,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: response.usage.cache_read_input_tokens ?? 0,
      },
    };
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI is busy right now. Try again in a minute.", 429);
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new AiError("AI isn’t set up correctly on this server.", 503);
    if (e instanceof Anthropic.BadRequestError) throw new AiError("That request couldn’t be processed.", 400);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("Couldn’t reach the AI service. Try again.", 504);
    if (e instanceof Anthropic.APIError) throw new AiError("The AI service had a problem. Try again.", 502);
    throw e;
  }
}
