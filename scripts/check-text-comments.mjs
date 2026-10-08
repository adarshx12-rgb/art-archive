// Reproduce pinned text edits, including a deliberate 4:5 -> 16:9 change.
// --live additionally checks the configured concept/prompt models (uses API credit).
import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const base = process.env.BASE || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
let example;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/builder");
  example = await page.evaluate(async () => {
    const { defaultState, encodeState, decodeState } = await import("/src/lib/prompt/state.ts");
    const { shotCamera } = await import("/src/lib/scene/camera.ts");
    const { newActor } = await import("/src/lib/scene/model.ts");
    const { applyLayerEdit } = await import("/src/lib/scene/convert.ts");
    const { composePrompt } = await import("/src/lib/prompt/compose.ts");
    const { customTemplates } = await import("/src/content/styles/custom.ts");
    const state = {
      ...defaultState(), style: "custom", customStyle: { template: "canvas", text: customTemplates.find((t) => t.id === "canvas").text },
      format: "magazine", aspect: "4:5", paletteMode: "custom", count: 2,
      custom: ["#0CC04B", "#000000", "#FF0000", "#0000FF"],
      comments: [
        { id: "blend", x: 0.59, y: 0.19, text: "blend the etxt with the background" },
        { id: "fill", x: 0.1, y: 0.39, text: "fill entire canvas with the same text diagaonally" },
      ],
    };
    const camera = shotCamera(state);
    state.actors = [[0.397, 0.275], [0.918, -0.025], [0.076, 0.275], [0.31, 0.088], [0.397, -0.043]].map(([x, y]) =>
      applyLayerEdit(camera, { ...newActor("text", "what the chat", []), scale: 0.54 }, { x, y, rotation: -23.1 }));
    state.aspect = "16:9";
    const query = encodeState(state).toString();
    const restored = decodeState(new URLSearchParams(query));
    if (restored.issues.length) throw new Error(restored.issues.join("; "));
    if (restored.state.aspect !== "16:9") throw new Error("Lost landscape aspect");
    return { query, prompt: composePrompt(restored.state).prompt };
  });
  await page.goto(base + "/builder?" + example.query, { waitUntil: "networkidle" });
  const values = await page.locator("textarea").evaluateAll((fields) => fields.map((field) => field.value));
  if (!values.includes(example.prompt)) throw new Error("Rendered prompt does not match composed facts");
  if (!example.prompt.includes("Text pattern:") || !example.prompt.includes("Blend every repetition")) throw new Error("Comment edits missing");
  if (/exactly 5 placed|Leave unoccupied areas empty/.test(example.prompt)) throw new Error("Old layout contradicts edits");
  if (errors.length) throw new Error(errors.join("; "));
  await fs.mkdir("output/text-comments", { recursive: true });
  await fs.writeFile("output/text-comments/facts.txt", example.prompt);
  await fs.writeFile("output/text-comments/builder-url.txt", base + "/builder?" + example.query);
  await page.screenshot({ path: "output/text-comments/builder.png" });
  console.log("PASS: landscape aspect, comment edits, share-link round trip and rendered prompt; no browser errors.");
} finally {
  await browser.close();
}

if (process.argv.includes("--live")) {
  const post = async (route, body) => {
    const response = await fetch(base + route, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify(body), signal: AbortSignal.timeout(180000) });
    const data = await response.json();
    if (!response.ok) throw new Error(`${route}: ${response.status} ${data.error}`);
    return data;
  };
  const ideas = await post("/api/concepts", { query: example.query, exclude: [] });
  await fs.writeFile("output/text-comments/concepts.json", JSON.stringify(ideas, null, 2));
  const { tags: _, ...brief } = ideas.concepts[0];
  const result = await post("/api/prompt", { query: example.query, brief });
  await fs.writeFile("output/text-comments/result.json", JSON.stringify(result, null, 2));
  await fs.writeFile("output/text-comments/prompt.txt", result.prompt);
  if (!result.prompt.includes("Text pattern:") || !result.prompt.includes("Blend every repetition")) throw new Error("AI lost the comment edits");
  if (!result.prompt.includes("16:9")) throw new Error("AI lost landscape aspect");
  if (result.warnings.length) throw new Error(result.warnings.join("; "));
  console.log(`PASS: live concepts and prompt (${result.model}); full-canvas repeat and uniform blend retained, no warnings.`);
}
