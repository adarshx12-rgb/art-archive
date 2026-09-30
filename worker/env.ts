/** Bindings and settings the Worker receives (see wrangler.jsonc). */
export interface Env {
  ASSETS: Fetcher;
  AI_LIMIT?: RateLimit;
  /** Secrets. Never in code or config files. */
  OPENROUTER_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  /** Comma-separated OpenRouter model IDs, tried in order. */
  OPENROUTER_MODELS?: string;
  /** The same for writing final prompts, which a different model may do best; empty uses OPENROUTER_MODELS. */
  OPENROUTER_PROMPT_MODELS?: string;
  /** Anthropic model used directly as the last resort. */
  AI_MODEL?: string;
  /** Sent to OpenRouter for app attribution. */
  SITE_URL?: string;
  /** "1" lets requests pin one model with an x-ai-model header (local evals only). */
  ALLOW_MODEL_OVERRIDE?: string;
}
