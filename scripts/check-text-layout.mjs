import { chromium } from "playwright-core";
import fs from "node:fs/promises";

const base = process.env.BASE || "http://localhost:5173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/builder");
  const example = await page.evaluate(async () => {
    const { defaultState, encodeState, decodeState } = await import("/src/lib/prompt/state.ts");
    const { shotCamera, projectActor } = await import("/src/lib/scene/camera.ts");
    const { newActor } = await import("/src/lib/scene/model.ts");
    const { applyLayerEdit } = await import("/src/lib/scene/convert.ts");
    const { composePrompt } = await import("/src/lib/prompt/compose.ts");
    const state = {
      ...defaultState(), style: "custom", paletteMode: "custom", count: 2,
      custom: ["#00C447", "#000000", "#FF0000", "#0000FF"],
      customStyle: { template: null, text: "Full-bleed diagonal typography wallpaper. Large, equal-size, bold rounded sans-serif lowercase words in evenly spaced parallel rows, all rising 18 degrees to the right. Smooth anti-aliased lettering with subtly softened edges. Flat green ground, black letters. The pattern continues beyond every edge. No separate title, border, icons, tiny type or pixel-art lettering." },
    };
    const cam = shotCamera(state);
    const angle = -18 * Math.PI / 180;
    // Rotate the lattice in physical frame units, so all words share one baseline.
    for (let row = -6; row <= 6; row++) {
      for (let col = -2; col <= 2; col++) {
        const u = col * 0.64 + (Math.abs(row) % 2) * 0.12;
        const v = row * 0.125;
        const x = 0.5 + (u * Math.cos(angle) - v * Math.sin(angle)) / 0.8;
        const y = 0.5 + u * Math.sin(angle) + v * Math.cos(angle);
        if (x < -0.32 || x > 1.32 || y < -0.1 || y > 1.1) continue;
        const actor = { ...newActor("text", "what the chat", []), scale: 0.4025 };
        state.actors.push(applyLayerEdit(cam, actor, { x, y, rotation: -18 }));
      }
    }
    const query = encodeState(state).toString();
    const restored = decodeState(new URLSearchParams(query));
    if (restored.issues.length) throw new Error(restored.issues.join("; "));
    const sizes = restored.state.actors.map((a) => projectActor(cam, a).size);
    if (Math.max(...sizes) - Math.min(...sizes) > 0.001) throw new Error("Text sizes differ");
    return { query, prompt: composePrompt(restored.state).prompt, count: state.actors.length };
  });
  if (example.query.length > 6000) throw new Error("Example exceeds the prompt API query limit");
  await page.goto(base + "/builder?" + example.query, { waitUntil: "networkidle" });
  const prompt = await page.locator("textarea").filter({ visible: true }).all();
  const values = await Promise.all(prompt.map((field) => field.inputValue()));
  if (!values.includes(example.prompt)) throw new Error("Builder prompt differs from composed facts");
  if (!example.prompt.includes(`Text layout: exactly ${example.count}`)) throw new Error("Missing layout");
  if (example.prompt.includes("[describe your subject]")) throw new Error("Unresolved subject");
  if (errors.length) throw new Error(errors.join("; "));
  await fs.mkdir("output/text-layout", { recursive: true });
  await fs.writeFile("output/text-layout/prompt.txt", example.prompt);
  await fs.writeFile("output/text-layout/builder-url.txt", base + "/builder?" + example.query);
  await page.screenshot({ path: "output/text-layout/builder.png" });
  console.log(`PASS: ${example.count} equal-size diagonal text elements, URL round-trip, rendered prompt, no browser errors.`);
} finally {
  await browser.close();
}
