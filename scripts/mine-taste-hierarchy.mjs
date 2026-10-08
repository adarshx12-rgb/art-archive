// Mines reading-order priors from the TASTE dataset: 720 graphic-design briefs
// written about real designs (Zhu et al. 2026, arXiv:2605.20731, MIT). A model
// labels each brief's design kind and the content roles a viewer reads, in
// order; the script aggregates them per kind into src/content/hierarchy-patterns.ts,
// which the content planner uses as priors.
//
// Costs money (prints what OpenRouter charged). Run rarely:
//   node scripts/mine-taste-hierarchy.mjs [--model google/gemini-3.5-flash-lite]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const model = arg("--model", "google/gemini-3.5-flash-lite");

const KINDS = ["poster", "flyer", "social", "advert", "infographic", "screen", "magazine", "thumbnail", "other"];
const ROLES = ["brand", "headline", "subhead", "hero", "offer", "body", "cta", "contact", "detail"];
const ROLE_HELP = `brand: logo or company name as a mark; headline: the main words; subhead: a secondary line under or near the headline; hero: the main image or illustration; offer: a price, discount or deal; body: supporting copy or a list of features; cta: a call to action (book now, sign up); contact: address, phone, email, website, social handle; detail: small extra information (dates, fine print, footnotes, small icons).`;

async function key() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const vars = await fs.readFile(path.join(root, ".dev.vars"), "utf8").catch(() => "");
  const found = vars.match(/^OPENROUTER_API_KEY\s*=\s*["']?([^\s"'\r\n]+)/m)?.[1];
  if (!found) throw new Error("Set OPENROUTER_API_KEY or add it to .dev.vars.");
  return found;
}

/** Every distinct brief, from the dataset's public rows API (no download of images). */
async function briefs() {
  const seen = new Map();
  for (let offset = 0; ; offset += 100) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=purvanshi/TASTE&config=prompts&split=train&offset=${offset}&length=100`;
    const page = await fetch(url, { signal: AbortSignal.timeout(60000) }).then((r) => r.json());
    const rows = page.rows ?? [];
    for (const { row } of rows) if (!seen.has(row.prompt_id_src)) seen.set(row.prompt_id_src, row.prompt_text);
    if (rows.length < 100) break;
  }
  return [...seen.entries()].map(([id, text]) => ({ id, text }));
}

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["briefs"],
  properties: {
    briefs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "kind", "order"],
        properties: { id: { type: "integer" }, kind: { type: "string", enum: KINDS }, order: { type: "array", items: { type: "string", enum: ROLES } } },
      },
    },
  },
};

const SYSTEM = `You label graphic-design briefs. Each brief describes a real, finished design: its purpose, then its aesthetics, often naming what is largest, what draws the eye first and how the eye travels.
For each brief give:
- kind: ${KINDS.join(", ")}. poster: a standalone printed or event poster; flyer: a handout or leaflet with practical details; social: a social-media post or story; advert: a product or service advertisement or banner; infographic: data, steps or explanations; screen: an app or web interface; magazine: a cover or editorial page; thumbnail: a video thumbnail; other: anything else.
- order: the content roles the design contains, in the order a viewer reads them (what the brief says is largest or seen first comes first). Use each role at most once. Roles: ${ROLE_HELP}
Only use what the brief describes; do not add roles it does not mention.`;

async function label(apiKey, batch) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "x-title": "FORM / FIELD hierarchy mining" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(batch.map((b) => ({ id: b.id, brief: b.text.slice(0, 2500) }))) },
      ],
      response_format: { type: "json_schema", json_schema: { name: "labels", strict: true, schema } },
      provider: { require_parameters: true },
      reasoning: { effort: "low" },
      max_tokens: 16000,
    }),
    signal: AbortSignal.timeout(120000),
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  const choice = body.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error("answer cut off at the token limit");
  const content = choice?.message?.content ?? "";
  return { labels: JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")).briefs, cost: body.usage?.cost ?? 0 };
}

const apiKey = await key();
const all = await briefs();
console.log(`fetched ${all.length} briefs; labelling with ${model}`);

const batches = [];
for (let i = 0; i < all.length; i += 10) batches.push(all.slice(i, i + 10));
const labels = [];
let cost = 0;
let next = 0;
let skipped = 0;
// A few at a time: fast, and kind to rate limits.
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < batches.length) {
      const batch = batches[next++];
      for (let attempt = 1; ; attempt++) {
        try {
          const r = await label(apiKey, batch);
          const ids = new Set(batch.map((b) => b.id));
          labels.push(...r.labels.filter((l) => ids.has(l.id)));
          cost += r.cost;
          break;
        } catch (e) {
          // A batch that keeps failing is left out rather than sinking the whole run; the count is reported.
          if (attempt >= 3) {
            skipped += batch.length;
            console.warn(`batch left out after 3 tries (${e.message})`);
            break;
          }
          console.warn(`batch failed (${e.message}); retrying`);
        }
      }
    }
  }),
);

// Aggregate per kind: how often each role appears, and where it sits on average.
const byKind = Object.fromEntries(KINDS.map((k) => [k, []]));
for (const l of labels) {
  const order = [...new Set(l.order)];
  if (!order.length) continue;
  // "other" pools every brief, so it doubles as the prior for thinly covered kinds.
  byKind.other.push(order);
  if (l.kind !== "other") byKind[l.kind].push(order);
}
function pattern(orders) {
  const presence = {};
  const position = {};
  for (const order of orders) {
    order.forEach((role, i) => {
      presence[role] = (presence[role] ?? 0) + 1;
      (position[role] ??= []).push(order.length > 1 ? i / (order.length - 1) : 0);
    });
  }
  const share = Object.fromEntries(Object.entries(presence).map(([r, n]) => [r, Math.round((n / orders.length) * 100) / 100]));
  const mean = (r) => position[r].reduce((a, b) => a + b, 0) / position[r].length;
  const order = Object.keys(share).filter((r) => share[r] >= 0.15).sort((a, b) => mean(a) - mean(b));
  return { briefs: orders.length, order, presence: Object.fromEntries(order.map((r) => [r, share[r]])) };
}
const pooled = pattern(byKind.other);
const result = Object.fromEntries(
  KINDS.map((k) => {
    const own = k === "other" ? pooled : pattern(byKind[k]);
    // Too few briefs to trust: borrow the pooled order, keep the count honest.
    return [k, own.briefs >= 5 && own.order.length > 1 ? own : { ...pooled, briefs: own.briefs }];
  }),
);

const file = `// Generated by scripts/mine-taste-hierarchy.mjs on ${new Date().toISOString().slice(0, 10)} with ${model}. Do not edit by hand.
//
// Reading-order priors: for each kind of design, the content roles designers'
// briefs describe and the order a viewer reads them. Source: the ${labels.length}
// designer-written briefs in TASTE (Zhu et al. 2026, arXiv:2605.20731; MIT),
// huggingface.co/datasets/purvanshi/TASTE. "other" pools every brief. Kinds with
// fewer than 5 briefs use the pooled order. presence: share of briefs with the role.

export type Role = ${ROLES.map((r) => `"${r}"`).join(" | ")};
export type DesignKind = ${KINDS.map((k) => `"${k}"`).join(" | ")};

export const ROLES: Role[] = ${JSON.stringify(ROLES)};
export const DESIGN_KINDS: DesignKind[] = ${JSON.stringify(KINDS)};

export interface HierarchyPattern {
  briefs: number;
  order: Role[];
  presence: Partial<Record<Role, number>>;
}

export const HIERARCHY: Record<DesignKind, HierarchyPattern> = ${JSON.stringify(result, null, 2)};
`;
await fs.writeFile(path.join(root, "src/content/hierarchy-patterns.ts"), file);
console.log(`mined ${labels.length} of ${all.length} briefs (${skipped} left out); cost $${cost.toFixed(4)}`);
for (const k of KINDS) console.log(`  ${k.padEnd(12)} ${String(result[k].briefs).padStart(4)}  ${result[k].order.join(" → ")}`);
