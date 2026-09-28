import { chromium } from "playwright-core";
import fs from "node:fs";
// Usage: npm run build && npm run preview  (in one terminal), then npm run e2e
// Drives your locally installed Chrome; set CHROME_PATH if it lives elsewhere.
const BASE = process.env.BASE || "http://localhost:4173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
let pass = 0, fail = 0;
const check = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  -- " + extra : ""}`); };
const clip = async () => (await page.evaluate(() => navigator.clipboard.readText())).split(String.fromCharCode(13)).join("");
const step = async (name, fn) => { try { await fn(); } catch (e) { fail++; console.log(`FAIL  ${name} threw: ${e.message.split("\n")[0]}`); } };

await step("styles", async () => {
  await page.goto(BASE + "/styles", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Search by name").fill("chrome");
  await page.locator("summary").filter({ hasText: "Filters" }).click();
  await page.getByRole("button", { name: "Neon", exact: true }).click();
  await page.waitForTimeout(200);
  const url = new URL(page.url());
  const names = await page.locator("main ul li h3").allTextContents();
  check("search+filter combine and write URL", url.searchParams.get("q") === "chrome" && url.searchParams.get("colour") === "neon" && names.length > 0, names.join(", "));
  await page.reload({ waitUntil: "networkidle" });
  const names2 = await page.locator("main ul li h3").allTextContents();
  check("filters restore from URL after reload", JSON.stringify(names) === JSON.stringify(names2) && (await page.getByPlaceholder("Search by name").inputValue()) === "chrome");
  await page.getByPlaceholder("Search by name").fill("qwertyzzz");
  await page.getByRole("heading", { name: "No styles match." }).waitFor();
  check("empty state shown", await page.getByRole("heading", { name: "No styles match." }).isVisible());
  await page.getByRole("button", { name: "Clear search and filters" }).first().click();
  await page.waitForTimeout(250);
  const n63 = await page.locator("main article h3").count(); check("clear restores all 63", n63 === 63, String(n63));
  await page.getByLabel("Sort").selectOption("az");
  await page.waitForTimeout(250);
  const first = (await page.locator("main ul li h3").first().textContent())?.trim();
  check("alphabetical sort", first === "70\u2019s Retro", first);
});

await step("palettes", async () => {
  for (const n of [2, 3, 4]) {
    await page.goto(`${BASE}/palettes?n=${n}`, { waitUntil: "networkidle" });
    const metas = await page.locator("main ul > li article > div:first-child > span.meta").allTextContents();
    check(`palette filter n=${n} exact`, metas.length > 0 && metas.every((m) => m.trim() === `${n} colours`), `${metas.length} palettes`);
  }
});

await step("favourites", async () => {
  await page.goto(BASE + "/styles/bauhaus", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Save Bauhaus/ }).first().click();
  await page.goto(BASE + "/palettes/acid-night", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Save Acid Night/ }).first().click();
  await page.reload({ waitUntil: "networkidle" });
  check("save state survives refresh (aria-pressed)", (await page.getByRole("button", { name: /Acid Night/, pressed: true }).count()) >= 1);
  await page.goto(BASE + "/saved", { waitUntil: "networkidle" });
  const saved = await page.locator("main h3").allTextContents();
  check("saved page lists both", saved.includes("Bauhaus") && saved.includes("Acid Night"), saved.join(", "));
  await page.getByRole("button", { name: /Saved Bauhaus/ }).click();
  await page.reload({ waitUntil: "networkidle" });
  check("unsave persists", !(await page.locator("main h3").allTextContents()).includes("Bauhaus"));
  await page.evaluate(() => localStorage.setItem("formfield:saved:v1", "{broken json"));
  await page.reload({ waitUntil: "networkidle" });
  check("malformed localStorage handled", await page.getByRole("heading", { name: "Saved", level: 1 }).isVisible());
  await page.evaluate(() => localStorage.setItem("formfield:saved:v1", JSON.stringify({ styles: ["swiss", "gone", 5], palettes: "x" })));
  await page.reload({ waitUntil: "networkidle" });
  check("partially valid storage keeps valid slugs", (await page.locator("main h3").allTextContents()).includes("Swiss / International Typographic Style"));
});

let prompt = "";
await step("builder", async () => {
  await page.goto(BASE + "/styles/steampunk", { waitUntil: "networkidle" });
  const [tab] = await Promise.all([ctx.waitForEvent("page"), page.getByRole("link", { name: "Use in builder" }).first().click()]);
  await tab.waitForLoadState("networkidle");
  check("builder opens in a new tab", tab.url().includes("/builder?s=steampunk"));
  const builderUrl = tab.url();
  await tab.close();
  await page.goto(builderUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("#style-select");
  check("style carries into builder", (await page.locator("#style-select").inputValue()) === "steampunk");
  await page.locator("#subject").fill("a lighthouse keeper reading");
  prompt = await page.locator("#prompt").inputValue();
  check("image prompt uses subject", prompt.startsWith("An image of a lighthouse keeper reading, in the Steampunk style.") && !prompt.includes("Camera:"));
  check("sketch draws the subject", /lighthouse, keeper/.test((await page.locator("main svg[role=img]").getAttribute("aria-label")) ?? ""));
  await page.getByRole("button", { name: /Camera/ }).click();
  await page.getByRole("button", { name: "Low angle" }).click();
  await page.getByRole("button", { name: "35mm", exact: true }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("camera preset adds a shot line", prompt.includes("Shot: from a low angle looking up, on a 35mm lens"));
  await page.getByRole("button", { name: /Film setup/ }).click();
  await page.getByRole("button", { name: "Noir" }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("film preset adds a film line", prompt.includes("Film setup: the moody, shadowy tone of film noir"));

  check("builder is image-only", (await page.getByText("Video", { exact: true }).count()) === 0);
  await page.getByRole("button", { name: /ADD/ }).click();
  check("ADD puts the typed subject on the sketch and selects it", (await page.locator("section[aria-label='Transform: a lighthouse keeper reading']").count()) === 1);
  check("ADD clears the subject box", (await page.locator("#subject").inputValue()) === "");
  await page.locator("#subject").fill("a scruffy dog");
  await page.locator("#subject").press("Enter");
  prompt = await page.locator("#prompt").inputValue();
  check("subjects are named in the prompt", /^An image of a (lighthouse keeper reading and a scruffy dog|scruffy dog and a lighthouse keeper reading),/.test(prompt));
  await page.getByLabel("Position Z", { exact: true }).click();
  await page.getByLabel("Position Z", { exact: true }).fill("2");
  await page.getByLabel("Position Z", { exact: true }).press("Enter");
  prompt = await page.locator("#prompt").inputValue();
  check("the subject nearest the camera becomes the main subject", prompt.startsWith("An image of a scruffy dog and a lighthouse keeper reading,"));
  await page.getByRole("button", { name: "Remove a scruffy dog" }).click();
  await page.locator("main svg g[aria-label='a lighthouse keeper reading']").click();
  await page.getByLabel("Rotation Z", { exact: true }).click();
  await page.getByLabel("Rotation Z", { exact: true }).fill("0x+90");
  await page.getByLabel("Rotation Z", { exact: true }).press("Enter");
  await page.waitForTimeout(400);
  prompt = await page.locator("#prompt").inputValue();
  check("placed subject adds a layout line", /Layout: a lighthouse keeper reading, [^;]*on its side \(the main subject\)\./.test(prompt), prompt.split(String.fromCharCode(10)).find((l) => l.startsWith("Layout")));
  check("the 3D scene is in the share link", (new URL(page.url()).searchParams.get("sc") ?? "").startsWith("person~a lighthouse keeper reading~"));
  // Look around: drag empty sky in the 3D view.
  const sketch = page.locator("main svg[role=img]");
  const box = await sketch.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.1);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.25, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  check("dragging the 3D view turns it (saved in the link)", (new URL(page.url()).searchParams.get("ob") ?? "") !== "");
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.waitForTimeout(400);
  check("Reset view returns to the shot", new URL(page.url()).searchParams.get("ob") === null);
  await page.getByText("2D board", { exact: true }).click();
  check("2D board hides depth controls", (await page.getByLabel("Position Z", { exact: true }).count()) === 0);
  await page.getByText("3D view", { exact: true }).click();
  await page.getByRole("button", { name: "Remove a lighthouse keeper reading" }).click();
  await page.locator("#subject").fill("a lighthouse keeper reading");
  await page.getByText("Curated", { exact: true }).click();
  await page.locator("label").filter({ hasText: /^4$/ }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("4-colour curated palette in prompt", (prompt.match(/#[0-9A-F]{6}/g) || []).length === 4, (prompt.match(/#[0-9A-F]{6}/g) || []).join(" "));
  await page.getByRole("button", { name: "Edit these colours" }).click();
  await page.getByLabel("1. background").fill("#123456");
  prompt = await page.locator("#prompt").inputValue();
  check("custom colour edit updates prompt live", prompt.includes("#123456"));
  await page.locator("label").filter({ hasText: /^✓?2$/ }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("2-colour custom palette in prompt", (prompt.match(/#[0-9A-F]{6}/g) || []).length === 2);
});

await step("edit protection", async () => {
  await page.goto(BASE + "/builder?s=swiss&q=a%20cat", { waitUntil: "networkidle" });
  await page.locator("#prompt").fill("MY OWN PROMPT TEXT");
  await page.getByText("Strong", { exact: true }).click();
  check("manual edit survives settings change", (await page.locator("#prompt").inputValue()) === "MY OWN PROMPT TEXT");
  check("stale-edit notice shown", await page.getByText("Settings changed since you edited the prompt").isVisible());
  await page.getByRole("button", { name: "Regenerate" }).click();
  check("regenerate asks for confirmation (dialog)", await page.getByRole("dialog", { name: "Replace your edited prompt?" }).isVisible());
  await page.keyboard.press("Escape");
  check("Escape cancels dialog and keeps edits", (await page.locator("#prompt").inputValue()) === "MY OWN PROMPT TEXT");
  await page.getByRole("button", { name: "Regenerate" }).click();
  await page.getByRole("button", { name: "Replace prompt" }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("confirmed regenerate replaces prompt", prompt.includes("fully committed") && prompt.includes("a cat"));
});

await step("copy/download/share", async () => {
  await page.getByRole("button", { name: "Copy prompt" }).click();
  check("copy prompt -> clipboard", (await clip()) === prompt);
  check("copy shows status message", (await page.getByRole("status").filter({ hasText: "Copied prompt" }).count()) === 1);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download .txt" }).click()]);
  const txt = fs.readFileSync(await dl.path(), "utf8");
  check("download .txt content", txt.trim() === prompt.trim(), dl.suggestedFilename());
  await page.getByText("Restyle an image", { exact: true }).click();
  await page.locator("label").filter({ hasText: /^Background$/ }).click();
  await page.getByRole("button", { name: /Lighting/ }).click();
  await page.getByRole("button", { name: "Golden hour" }).click();
  const before = await page.locator("#prompt").inputValue();
  await page.getByRole("button", { name: "Copy share link" }).click();
  const link = await clip();
  const p2 = await ctx.newPage();
  await p2.goto(link, { waitUntil: "networkidle" });
  check("share link restores identical prompt", (await p2.locator("#prompt").inputValue()) === before, link);
  await p2.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Reset builder" }).click();
  await page.waitForTimeout(600); // the address bar updates after a short pause
  check("reset returns defaults", (await page.locator("#subject").inputValue()) === "" && new URL(page.url()).searchParams.get("t") === null);
});

await step("recovery", async () => {
  await page.goto(BASE + "/builder?s=nope&o=gif&c=zz", { waitUntil: "networkidle" });
  check("invalid builder params reported", await page.getByText("Some settings in this link couldn\u2019t be restored.").isVisible());
  await page.goto(BASE + "/styles/not-a-style", { waitUntil: "networkidle" });
  check("unknown style -> recovery", await page.getByRole("heading", { name: "That style isn\u2019t in the library." }).isVisible());
  await page.goto(BASE + "/palettes/nope", { waitUntil: "networkidle" });
  check("unknown palette -> recovery", await page.getByRole("heading", { name: "That palette isn\u2019t in the library." }).isVisible());
  await page.goto(BASE + "/totally/unknown", { waitUntil: "networkidle" });
  check("unknown route -> 404 screen", await page.getByRole("heading", { name: "This page doesn\u2019t exist." }).isVisible());
  await page.goto(BASE + "/styles/y2k", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Your image", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  check("tabs arrow-key navigation", (await page.getByRole("tab", { name: "Your video" }).getAttribute("aria-selected")) === "true");
  // mobile menu
  const m = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await m.goto(BASE + "/", { waitUntil: "networkidle" });
  await m.getByRole("button", { name: "Menu" }).click();
  await m.locator("#mobile-nav").getByRole("link", { name: "Palettes" }).click();
  await m.waitForURL(/\/palettes/);
  check("mobile menu navigates and closes", !(await m.locator("#mobile-nav").isVisible()));
});

await step("video links open as image prompts", async () => {
  await page.goto(BASE + "/builder?s=swiss&o=video", { waitUntil: "networkidle" });
  check("video link notice", await page.getByText("this video link opened as an image prompt").isVisible());
  check("video link prompt is an image", (await page.locator("#prompt").inputValue()).startsWith("An image of"));
});

await step("leave warning", async () => {
  await page.goto(BASE + "/builder?s=memphis", { waitUntil: "networkidle" });
  await page.locator("#prompt").fill("edited text");
  await page.locator("header").getByRole("link", { name: "Styles" }).click();
  const dlg = page.getByRole("dialog", { name: "Leave with unsaved edits?" });
  await dlg.waitFor({ timeout: 3000 });
  check("in-app navigation with edits asks first", await dlg.isVisible());
  await page.getByRole("button", { name: "Cancel" }).click();
  check("cancel stays on builder with edits", page.url().includes("/builder") && (await page.locator("#prompt").inputValue()) === "edited text");
  await page.locator("header").getByRole("link", { name: "Styles" }).click();
  await page.getByRole("button", { name: "Leave and discard" }).click();
  await page.waitForURL(/\/styles$/);
  check("confirm leaves", true);
});

await step("theme toggle", async () => {
  const t = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "dark" });
  const p = await t.newPage();
  await p.goto(BASE + "/styles", { waitUntil: "networkidle" });
  const theme = () => p.evaluate(() => document.documentElement.dataset.theme);
  check("follows system dark preference", (await theme()) === "dark");
  await p.getByRole("button", { name: "Switch to light mode" }).click();
  check("toggle switches to light", (await theme()) === "light");
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check("light background applied", bg === "rgb(244, 242, 237)", bg);
  await p.reload({ waitUntil: "domcontentloaded" });
  check("choice persists across reload (set before paint)", (await theme()) === "light");
  await p.getByRole("button", { name: "Switch to dark mode" }).click();
  const bg2 = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check("dark background applied", bg2 === "rgb(21, 21, 20)", bg2);
  await t.close();
});

check("no console errors during journeys", errors.length === 0, errors.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
