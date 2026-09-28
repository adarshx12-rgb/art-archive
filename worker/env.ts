/** Bindings and settings the Worker receives (see wrangler.jsonc). */
export interface Env {
  ASSETS: Fetcher;
  AI_LIMIT?: RateLimit;
  /** Secret. Never in code or config files. */
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;
}
