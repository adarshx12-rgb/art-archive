// Scores the AI endpoints against fixed test cases. Every run calls the model
// and costs money (the report prints what OpenRouter charged).
//
// Usage: put your keys in .dev.vars (see .dev.vars.example), run `npm run dev`
// in one terminal, then in another:
//   npm run eval:ai                                  # the normal chain
//   MODEL=google/gemini-3.8-flash npm run eval:ai    # pin one OpenRouter model
//   MODEL=openai/gpt-6-luna npm run eval:ai
//   MODEL=claude-sonnet-5 npm run eval:ai            # Anthropic directly
// Pinning needs ALLOW_MODEL_OVERRIDE=1 in .dev.vars.

import { writeFile } from "node:fs/promises";

const BASE = process.env.BASE || "http://localhost:5173";
const MODEL = process.env.MODEL;
const models = new Set();
let cost = 0;
const post = async (path, body) => {
  const headers = { "content-type": "application/json", origin: BASE, ...(MODEL ? { "x-ai-model": MODEL } : {}) };
  const res = await fetch(BASE + path, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${data.error}`);
  if (data.model) models.add(data.model);
  if (data.usage?.cost) cost += data.usage.cost;
  return data;
};

const settings = { shot: "auto", angle: "auto", lens: "auto", composition: "style", lighting: "style" };
const frame = { halfWidth: 1.3, height: 2.1, cameraZ: 3.3 };
const facing = (a) => {
  const t = ((a.rotation[1] % 360) + 540) % 360 - 180;
  return Math.abs(t) < 45 ? "camera" : Math.abs(t) > 135 ? "away" : t > 0 ? "right" : "left";
};

/** Each case: a description, and checks the scene must pass. */
const cases = [
  {
    text: "an old fisherman in a yellow raincoat mending a net on a jetty, a lighthouse far behind him",
    checks: [
      ["has a person labelled fisherman", (s) => s.actors.some((a) => a.glyph === "person" && /fisherman/i.test(a.label))],
      ["keeps 'yellow raincoat' in the label", (s) => s.actors.some((a) => /yellow raincoat/i.test(a.label))],
      ["lighthouse is behind the fisherman", (s) => {
        const f = s.actors.find((a) => /fisherman/i.test(a.label));
        const l = s.actors.find((a) => a.glyph === "lighthouse");
        return f && l && l.position[2] < f.position[2] - 5;
      }],
      ["adds nothing unasked (≤ 3 subjects)", (s) => s.actors.length <= 3],
    ],
  },
  {
    text: "two children running towards the camera chasing a red kite",
    checks: [
      ["two children as one group or two subjects", (s) => s.actors.filter((a) => a.glyph === "child").reduce((n, a) => n + a.count, 0) === 2],
      ["children are running", (s) => s.actors.filter((a) => a.glyph === "child").every((a) => a.pose === "run")],
      ["children face the camera", (s) => s.actors.filter((a) => a.glyph === "child").every((a) => facing(a) === "camera")],
    ],
  },
  {
    text: "close-up from a low angle of a knight at night",
    checks: [
      ["close-up shot", (s) => s.camera.shot === "close-up"],
      ["low angle", (s) => s.camera.angle === "low"],
      ["night lighting", (s) => s.lighting === "night"],
    ],
  },
  {
    text: "a woman sitting on a bench, a dog lying at her feet, seen from behind",
    checks: [
      ["woman sits", (s) => s.actors.some((a) => a.glyph === "person" && a.pose === "sit")],
      ["dog lies down", (s) => s.actors.some((a) => a.glyph === "animal" && a.pose === "lie")],
      ["woman faces away", (s) => s.actors.some((a) => a.glyph === "person" && facing(a) === "away")],
      ["there is a bench", (s) => s.actors.some((a) => a.glyph === "chair")],
    ],
  },
  {
    text: "a vintage red car parked in front of a diner, three crows on its roof",
    checks: [
      ["one car", (s) => s.actors.filter((a) => a.glyph === "car").length === 1],
      ["three crows", (s) => s.actors.filter((a) => a.glyph === "bird").reduce((n, a) => n + a.count, 0) === 3],
      ["crows are off the ground", (s) => s.actors.filter((a) => a.glyph === "bird").every((a) => a.position[1] > 0.8)],
    ],
  },
];

let pass = 0;
let total = 0;
for (const c of cases) {
  console.log(`\n▶ ${c.text}`);
  try {
    const scene = await post("/api/scene", { mode: "new", text: c.text, scene: [], frame, style: "retro", settings });
    for (const [name, fn] of c.checks) {
      const ok = Boolean(fn(scene));
      total++;
      if (ok) pass++;
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
    }
    // The final prompt must mention every subject and colour (the server checks; we count its warnings).
    const q = new URLSearchParams({ s: "retro", sc: scene.actors.map((a) => [a.glyph, a.label, ...a.position, ...a.rotation, a.scale, a.pose, a.count].join("~")).join("|") });
    const prompt = await post("/api/prompt", { query: q.toString() });
    total++;
    if (!prompt.warnings.length) pass++;
    console.log(`  ${prompt.warnings.length ? "FAIL" : "PASS"}  prompt covers every subject and colour${prompt.warnings.length ? ` (${prompt.warnings.join(" ")})` : ""}`);
  } catch (e) {
    total += c.checks.length + 1;
    console.log(`  FAIL  request failed: ${e.message}`);
  }
}
// ——— Art direction: novice briefs → three concepts → a prompt for each ———
const novice = [
  { name: "A cat, Swiss poster", q: { s: "swiss", fm: "poster", q: "a cat" } },
  { name: "Night Shift, Punk poster", q: { s: "punk", fm: "poster", q: "a woman dancing", tx: "Night Shift" } },
  { name: "Birthday flyer, words only", q: { s: "kidcore", fm: "flyer", tx: "Maya turns 30" } },
  { name: "Jazz magazine, Art Deco", q: { s: "art-deco", fm: "magazine", q: "a jazz trumpeter", tx: "Blue Hour" } },
  { name: "Speedrun thumbnail, Web 1.0", q: { s: "web-1-0", fm: "thumbnail", q: "a fox", tx: "Speedrun" } },
  { name: "Marble bust, Vaporwave image", q: { s: "vaporwave", q: "a marble bust" } },
  { name: "Night drive, Synthwave video", q: { s: "synthwave", o: "video", q: "a car driving at night" } },
  { name: "Restyle in Pop Art", q: { s: "pop-art", t: "restyle" } },
];
const samples = ["# Art direction samples", "", `Generated by \`npm run eval:ai\` on ${new Date().toISOString().slice(0, 10)}${MODEL ? ` with ${MODEL}` : ""}.`, ""];
const check = (ok, name) => {
  total++;
  if (ok) pass++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
};
for (const c of novice) {
  console.log(`\n▶ ${c.name}`);
  const query = new URLSearchParams(c.q).toString();
  samples.push(`## ${c.name}`, "", `Settings: \`${query}\``, "");
  try {
    const { concepts } = await post("/api/concepts", { query, exclude: [] });
    check(concepts.length === 3, "three concepts");
    check(new Set(concepts.map((x) => x.title)).size === concepts.length, "distinct titles");
    check(concepts.every((x) => x.tags.length > 0), "every concept uses the craft library");
    for (const concept of concepts) {
      const { tags, ...brief } = concept;
      const r = await post("/api/prompt", { query, brief });
      check(!r.warnings.length, `"${concept.title}" prompt is complete and adds no words${r.warnings.length ? ` (${r.warnings.join(" ")})` : ""}`);
      samples.push(`### ${concept.title}`, "", `${concept.idea}`, "", `*${tags.join(" · ")}*`, "", "```", r.prompt, "```", "");
    }
  } catch (e) {
    check(false, `request failed: ${e.message}`);
    samples.push(`Request failed: ${e.message}`, "");
  }
}
await writeFile(new URL("../docs/art-direction-samples.md", import.meta.url), samples.join("\n"));
console.log("\nSamples written to docs/art-direction-samples.md");
console.log(`\n${pass}/${total} checks passed (${Math.round((pass / total) * 100)}%)`);
console.log(`Answered by: ${[...models].join(", ") || "none"}${cost ? ` · OpenRouter cost $${cost.toFixed(4)}` : ""}`);
