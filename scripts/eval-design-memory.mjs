// Real model evaluation. Requires the dev server and its configured AI account.
import fs from "node:fs/promises";
const base = process.env.BASE || "http://localhost:5173";
const phase = process.argv[2] || "after";
const rerun = new Set((process.argv.find((a) => a.startsWith("--rerun="))?.slice(8) ?? "").split(","));
if (!["baseline", "after"].includes(phase)) throw new Error("Use baseline or after");
const patternUrl = await fs.readFile("output/text-layout/builder-url.txt", "utf8").catch(() => null);
const cases = [
  { id: "quiet-swiss", query: new URLSearchParams({ s: "swiss", fm: "poster", q: "a cat" }).toString() },
  { id: "grunge-boxer", query: new URLSearchParams({ s: "grunge", fm: "poster", q: "a boxer", tx: "Last Round" }).toString() },
  { id: "deco-product", query: new URLSearchParams({ s: "art-deco", q: "a jade perfume bottle", c: "102C24-DAC8A1", n: "2" }).toString() },
  { id: "clean-custom", query: new URLSearchParams({ s: "custom", cs: "Quiet contemporary product photography. Soft shadows, smooth surfaces, wide open space. No print texture, labels or decorations.", q: "a white ceramic bowl", c: "E6DDCD-39362F", n: "2" }).toString() },
  { id: "restyle", query: new URLSearchParams({ s: "pop-art", t: "restyle", k: "identity-composition-colours" }).toString() },
  ...(patternUrl ? [{ id: "equal-diagonal-type", query: new URL(patternUrl).search.slice(1) }] : []),
];
const post = async (route, body) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(base + route, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify(body), signal: AbortSignal.timeout(180000) });
    const data = await response.json();
    if ((response.status === 429 || response.status >= 500) && attempt < 2) { await new Promise((r) => setTimeout(r, response.status === 429 ? 61000 : 2500)); continue; }
    if (!response.ok) throw new Error(`${route}: ${response.status} ${data.error}`);
    return data;
  }
};
await fs.mkdir("output/design-memory", { recursive: true });
const results = [];
const previous = await fs.readFile(`output/design-memory/${phase}.json`, "utf8").then(JSON.parse).catch(() => ({ results: [] }));
for (const item of cases) {
  const saved = previous.results.find((r) => r.id === item.id && !r.error);
  if (saved && !rerun.has(item.id)) { results.push(saved); continue; }
  try {
    const ideas = await post("/api/concepts", { query: item.query, exclude: [] });
    const { tags: _, ...brief } = ideas.concepts[0];
    const prompt = await post("/api/prompt", { query: item.query, brief });
    results.push({ ...item, concepts: ideas, prompt });
    console.log(`${phase} ${item.id}: ${ideas.concepts.length} concepts, ${prompt.warnings.length} warnings, ${prompt.designSources?.length ?? 0} references`);
  } catch (error) { results.push({ ...item, error: error.message }); console.error(`${phase} ${item.id}: ${error.message}`); process.exitCode = 1; }
  await fs.writeFile(`output/design-memory/${phase}.json`, JSON.stringify({ phase, time: new Date().toISOString(), results }, null, 2));
}
// A resumed run may end with cached cases; include them in the final checkpoint too.
await fs.writeFile(`output/design-memory/${phase}.json`, JSON.stringify({ phase, time: new Date().toISOString(), results }, null, 2));
