/**
 * Make design templates with the AI models. This SPENDS API CREDITS (about
 * $0.13 a template), so it only runs with --generate. Templates are normally
 * designed by hand in src/content/templates.generated.json and checked for
 * free with `npm run templates` (scripts/check-templates.mjs).
 *
 *   node scripts/templates.mjs --generate                     every missing template
 *   node scripts/templates.mjs --generate --only art-deco,grunge --force
 *   node scripts/templates.mjs --generate --formats poster --model anthropic/claude-sonnet-5
 *
 * Each template is designed, checked (bounds, overlaps, contrast, fit, real
 * Google Fonts) and then reviewed and revised, up to twice, until the checks
 * pass. Results go to src/content/templates.generated.json (kept between runs,
 * so an interrupted run resumes) and a summary to docs/templates-report.md.
 * Uses the same models and keys as the Worker (wrangler.jsonc + .dev.vars).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";
import { z } from "zod";

if (!process.argv.includes("--generate")) {
  console.log("This script spends API credits. Add --generate to run it, or use `npm run templates` to check templates for free.");
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/content/templates.generated.json");
const REPORT = path.join(ROOT, "docs/templates-report.md");
const jiti = createJiti(import.meta.url);

const { styles } = await jiti.import("../src/content/styles/index.ts");
const { fontSuggestions } = await jiti.import("../src/content/fonts.ts");
const { TEMPLATE_FORMATS, styleColours } = await jiti.import("../src/content/templates.ts");
const { checkTemplate } = await jiti.import("../src/lib/templates/check.ts");
const { ask } = await jiti.import("../worker/ai.ts");

// ——— Options ———

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt("only")?.split(",");
const formats = opt("formats")?.split(",") ?? TEMPLATE_FORMATS.map((f) => f.id);
const model = opt("model");
const force = args.includes("--force");
const concurrency = Number(opt("jobs") ?? 6);

// ——— Env: the Worker's vars plus local secrets ———

const jsonc = fs.readFileSync(path.join(ROOT, "wrangler.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, "");
const env = { ...JSON.parse(jsonc).vars };
for (const line of fs.readFileSync(path.join(ROOT, ".dev.vars"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && m[2]) env[m[1]] = m[2];
}
if (model) env.ALLOW_MODEL_OVERRIDE = "1";

// ——— What the model returns ———

const ROLE = z.enum(["background", "primary", "secondary", "accent", "ink", "paper"]);
const Block = z.object({
  id: z.string().describe("Short kebab-case id, unique in the template, e.g. 'masthead', 'line-1', 'plate'."),
  kind: z.enum(["masthead", "headline", "subhead", "coverline", "body", "cta", "meta", "image", "shape"]),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotate: z.number().nullable(),
  text: z.string().nullable().describe("Sample words for text blocks; null for image and shape."),
  label: z.string().nullable().describe("The field name a visitor fills in, e.g. 'Masthead', 'Lead cover line'; null for image and shape."),
  font: z.string().nullable().describe("A Google Fonts family name, exactly as Google spells it."),
  weight: z.number().nullable(),
  size: z.number().nullable().describe("Font size as a fraction of the canvas height."),
  align: z.enum(["left", "center", "right"]).nullable(),
  upper: z.boolean().nullable(),
  tracking: z.number().nullable().describe("Letter spacing in em, e.g. 0.1."),
  leading: z.number().nullable().describe("Line height as a multiple of the size, e.g. 0.95."),
  italic: z.boolean().nullable(),
  colour: ROLE.nullable().describe("Text colour role."),
  shape: z.enum(["rect", "circle", "line", "arc", "stripes", "sunburst", "frame"]).nullable(),
  fill: ROLE.nullable(),
  stroke: ROLE.nullable(),
  opacity: z.number().nullable(),
});
const Template = z.object({
  name: z.string().describe("A short name for the layout, 2–4 words."),
  notes: z.array(z.string()).describe("3–4 notes, one plain sentence each, saying what a specific design choice does, e.g. 'The red block keeps the headline readable over the image.'"),
  background: ROLE,
  blocks: z.array(Block),
  prompt: z.string().describe("One or two sentences of layout direction for an image generator, naming text blocks as {id} slots."),
});
const Design = z.object({
  analysis: z.object({
    trends: z.array(z.string()).describe("3–5 current design trends in this format that suit the style."),
    principles: z.array(z.string()).describe("The 3–5 principles that matter most here."),
    concept: z.string().describe("The layout idea in one or two sentences."),
  }),
  template: Template,
});
const Review = z.object({
  critique: z.array(z.string()).describe("What is weak, specifically: hierarchy, balance, readability, faithfulness to the style, the check results."),
  template: Template,
});

// ——— Instructions ———

const RULES = `The canvas: x and y run 0–1 from the top-left corner; w and h are fractions of the canvas width and height. The canvas is {ratio} as wide as it is tall, so a block with w = h is not square unless ratio is 1. Blocks are drawn in order, first at the back.

Block kinds:
- image: the picture area (a photo or illustration in the style will fill it). Use shape "rect" (default), "circle" or "arc" (an arch, round at the top) to crop it. Most covers and thumbnails use one large image, often full-bleed (0, 0, 1, 1) with text laid over it.
- shape: graphic elements drawn in the style's colours. rect (a block or plate; set fill), circle (an ellipse filling the box), line (a rule as thick as h), arc (a half-disc, round side up), stripes (5 horizontal bands alternating fill and stroke colours), sunburst (rays fanning up from the bottom centre of the box, alternating fill and transparent), frame (a border, stroke colour, as thick as 3% of the smaller side). Use opacity below 1 for tints.
- masthead, headline, subhead, coverline, body, cta, meta: text. Give each: text (sample words that fit the style's world, never lorem ipsum), label, font, weight, size, align, upper, tracking, leading, italic, colour. Text wraps inside w and starts at the top of the box; make h fit the lines (lines × size × leading).

Colours are roles: background, primary, secondary, accent map to the style's swatches, given with their hex values; ink (#191919) and paper (#F4F2ED) are neutrals for type when the style's own colours don't contrast enough. Pick text colours that contrast strongly with what the text sits on (a shape's fill, or the background). Text laid over the image should sit on a plate (a shape) or be large, bold, and in a colour that contrasts with the background, because the image may be dark or light.

Fonts: real Google Fonts families only, spelled as Google spells them, at weights that family actually has. Prefer the style's suggested free fonts; otherwise pick a Google font that is true to the style's typography. Use at most two families.

Keep every text block at least 3% in from each edge. Text blocks must not overlap each other. Sizes: masthead 0.08–0.2, headlines 0.05–0.14, cover lines and subheads 0.025–0.05, body and meta 0.018–0.03 (thumbnails: headline 0.12–0.25, nothing under 0.05).

The notes field ("Why it works", shown to visitors): 3–4 sentences of plain, specific English, each naming one element of this layout (a block, a colour, a size, a position) and what it does for the reader, in under 20 words. Good: "The red block keeps the headline readable over the image." "Cover lines stay on the left so they don't cover the subject's face." Don't praise the design or the style, and don't use filler such as quintessential, iconic, authentic, uncompromising, honoring, seamless, effortless, curated, evokes, commanding, monumental or timeless; the automatic checks reject them.

The prompt field: one or two sentences telling an image generator how the image should be laid out for this format, naming each text block's words as a {id} slot (e.g. 'Masthead {masthead} across the top in tall gold Art Deco capitals; the lead line {lead} in the lower left'). Don't describe the style's colours or cues (the builder adds those), and don't name a particular subject: say "the subject" or "the main image", because people bring their own.`;

const SYSTEM_DESIGN = `You are a senior art director who designs magazine covers, posters, flyers and video thumbnails. You are making one layout template in a given visual style and format: a reusable starting point that people fill with their own words and image. Study the style's own look, typography, colours and what to avoid, and how the best current work in this format uses that style. The layout must feel unmistakably like the style, follow the format's principles, and read clearly.

${RULES}`;

const SYSTEM_REVIEW = `You are a demanding design director reviewing a layout template before it ships. Judge it as a designer would: hierarchy, balance and negative space, readability at the size it is seen, whether it is unmistakably the style (and avoids what the style avoids), and whether it follows the format's principles. You also get automatic check results; every failed check must be fixed. Then return the improved template: keep what works, fix what doesn't, and don't make it blander.

${RULES}`;

// ——— Google Fonts ———

const fontCache = new Map();
async function fontExists(family, weight = 400, italic = false) {
  const key = `${family}|${weight}|${italic}`;
  if (!fontCache.has(key)) {
    const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${axis}`;
    fontCache.set(key, fetch(url).then((r) => r.ok).catch(() => false));
  }
  return fontCache.get(key);
}

async function fontIssues(t) {
  const issues = [];
  for (const b of t.blocks) {
    if (!b.font) continue;
    if (!(await fontExists(b.font, b.weight ?? 400, b.italic ?? false)))
      issues.push({ block: b.id, message: `"${b.font}" at weight ${b.weight ?? 400}${b.italic ? " italic" : ""} is not on Google Fonts; pick a real family and a weight it has.` });
  }
  return issues;
}

// ——— One template ———

const round = (n) => Math.round(n * 1000) / 1000;
/** Drop the nulls the strict schema needed, round numbers, keep only what's drawn. */
function normalise(style, format, t) {
  const blocks = t.blocks.map((b) => {
    const out = {};
    for (const [k, v] of Object.entries(b)) if (v !== null && v !== "") out[k] = typeof v === "number" ? round(v) : v;
    if (b.kind === "image" || b.kind === "shape") for (const k of ["text", "label", "font", "weight", "size", "align", "upper", "tracking", "leading", "italic", "colour"]) delete out[k];
    return out;
  });
  return { style, format, name: t.name, notes: t.notes, background: t.background, blocks, prompt: t.prompt };
}

function brief(style, format) {
  const colours = styleColours(style);
  return {
    style: {
      name: style.name,
      kind: style.kind,
      about: style.about,
      look: style.look,
      cues: style.prompt.cues,
      avoid: style.prompt.avoid,
      colours: Object.fromEntries(Object.entries(colours).map(([role, hex], i) => [role, `${hex} (${style.swatches[i].name})`])),
      suggestedFonts: (fontSuggestions[style.slug] ?? []).filter((f) => f.licence === "free").map((f) => `${f.family} (${f.role.toLowerCase()}: ${f.why})`),
    },
    format: { name: format.label, aspect: format.aspect, ratio: round(format.ratio), principles: format.principles, textBlocks: format.expects },
  };
}

async function check(style, t) {
  return [...checkTemplate(t, styleColours(style)), ...(await fontIssues(t))];
}

let spent = 0;
/** ask(), with one retry when the failure is worth another go (timeouts, provider hiccups, overlong answers). */
async function askTwice(opts) {
  try {
    return await ask(env, opts, model);
  } catch (e) {
    if (e?.retryable === false) throw e;
    return ask(env, opts, model);
  }
}
async function makeOne(style, format) {
  const input = brief(style, format);
  const system = (s) => s.replace("{ratio}", String(round(format.ratio)));
  const d = await askTwice({ system: system(SYSTEM_DESIGN), user: JSON.stringify(input), schema: Design, name: "template_design", effort: "high", timeout: 240_000, maxTokens: 40_000 });
  spent += d.usage.cost ?? 0;
  let t = normalise(style.slug, format.id, d.data.template);
  let issues = await check(style, t);
  const critiques = [];
  // Always one design review; a second only if checks still fail.
  for (let round = 0; round < 2 && (round === 0 || issues.length); round++) {
    const r = await askTwice(
      {
        system: system(SYSTEM_REVIEW),
        user: JSON.stringify({ ...input, analysis: d.data.analysis, template: t, checks: issues.length ? issues.map((i) => i.message) : ["All automatic checks pass."] }),
        schema: Review,
        name: "template_review",
        effort: "high",
        timeout: 240_000, maxTokens: 40_000,
      },
    );
    spent += r.usage.cost ?? 0;
    critiques.push(...r.data.critique);
    const next = normalise(style.slug, format.id, r.data.template);
    const nextIssues = await check(style, next);
    // Keep the revision unless it made the checks worse.
    if (nextIssues.length <= issues.length) {
      t = next;
      issues = nextIssues;
    }
  }
  return { template: t, issues, analysis: d.data.analysis, critiques, model: d.model };
}

// ——— Run ———

const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const results = new Map(existing.map((t) => [`${t.style}/${t.format}`, t]));
const reportRows = [];
const jobs = [];
for (const style of styles) {
  if (only && !only.includes(style.slug)) continue;
  for (const format of TEMPLATE_FORMATS) {
    if (!formats.includes(format.id)) continue;
    if (!force && results.has(`${style.slug}/${format.id}`)) continue;
    jobs.push({ style, format });
  }
}

const save = () => {
  const order = new Map(styles.map((s, i) => [s.slug, i]));
  const fmt = new Map(TEMPLATE_FORMATS.map((f, i) => [f.id, i]));
  const list = [...results.values()].sort((a, b) => order.get(a.style) - order.get(b.style) || fmt.get(a.format) - fmt.get(b.format));
  fs.writeFileSync(OUT, JSON.stringify(list, null, 1) + "\n");
};

console.log(`${jobs.length} templates to make, ${concurrency} at a time${model ? ` on ${model}` : ""}.`);
const started = Date.now();
let done = 0;
async function worker() {
  while (jobs.length) {
    const { style, format } = jobs.shift();
    const tag = `${style.slug}/${format.id}`;
    try {
      const r = await makeOne(style, format);
      results.set(tag, r.template);
      save();
      reportRows.push({ tag, name: r.template.name, issues: r.issues.map((i) => i.message), concept: r.analysis.concept, model: r.model });
      console.log(`[${++done}] ${tag}: "${r.template.name}"${r.issues.length ? ` — ${r.issues.length} open issue(s)` : ""} (${r.model}, $${spent.toFixed(2)} so far)`);
    } catch (e) {
      reportRows.push({ tag, name: "FAILED", issues: [String(e.message ?? e)] });
      console.log(`[${++done}] ${tag}: FAILED ${e.message ?? e}`);
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));

const open = reportRows.filter((r) => r.issues.length);
const lines = [
  "# Template generation report",
  "",
  `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${reportRows.length} made · ${open.length} with open issues · $${spent.toFixed(2)} · ${Math.round((Date.now() - started) / 60000)} min`,
  "",
  "| Template | Layout | Open issues |",
  "|---|---|---|",
  ...reportRows.sort((a, b) => a.tag.localeCompare(b.tag)).map((r) => `| ${r.tag} | ${r.name} | ${r.issues.join("<br>") || "—"} |`),
  "",
];
fs.writeFileSync(REPORT, lines.join("\n"));
console.log(`\nDone in ${Math.round((Date.now() - started) / 60000)} min, $${spent.toFixed(2)}. ${open.length} with open issues. Report: docs/templates-report.md`);
