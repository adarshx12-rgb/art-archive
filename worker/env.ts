/** Bindings and settings the Worker receives (see wrangler.jsonc). */
export interface Env {
  ASSETS: Fetcher;
  /** Private bucket of reference thumbnails the director looks at (scripts/upload-refs.py). */
  REFS?: R2Bucket;
  AI_LIMIT?: RateLimit;
  /** Secrets. Never in code or config files. */
  OPENROUTER_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  /** Comma-separated OpenRouter model IDs, tried in order. */
  OPENROUTER_MODELS?: string;
  /** The same for writing final prompts, which a different model may do best; empty uses OPENROUTER_MODELS. */
  OPENROUTER_PROMPT_MODELS?: string;
  /** The same for design ideas (the art director); empty uses OPENROUTER_PROMPT_MODELS. */
  OPENROUTER_DIRECTOR_MODELS?: string;
  /** The same for reading pictures; these models must accept images. */
  OPENROUTER_VISION_MODELS?: string;
  /** The same for the content planner; empty skips the model and uses the rules plan. */
  OPENROUTER_PLANNER_MODELS?: string;
  /** How design ideas use gold prompts: "distinct" (one reference per concept), "single" (all riff on the best match) or "off". */
  GOLD_CONCEPT_MODE?: string;
  /** "on" (default): an art-director pass critiques and improves the concepts; "off" skips it. */
  CONCEPT_CRITIQUE?: string;
  /** Anthropic model used directly as the last resort. */
  AI_MODEL?: string;
  /** Sent to OpenRouter for app attribution. */
  SITE_URL?: string;
  /** "1" lets requests pin one model with an x-ai-model header (local evals only). */
  ALLOW_MODEL_OVERRIDE?: string;
}
