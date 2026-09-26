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
  await page.getByRole("link", { name: "Use in builder" }).first().click();
  await page.waitForURL(/\/builder/);
  await page.waitForSelector("#style-select");
  check("style carries into builder", (await page.locator("#style-select").inputValue()) === "steampunk");
  await page.locator("#subject").fill("a lighthouse keeper reading");
  prompt = await page.locator("#prompt").inputValue();
  check("image prompt uses subject", prompt.startsWith("An image of a lighthouse keeper reading, in the Steampunk style.") && !prompt.includes("Camera:"));
  await page.getByText("Video", { exact: true }).click();
  prompt = await page.locator("#prompt").inputValue();
  check("video prompt adds motion", prompt.includes("-second video of") && prompt.includes("Camera:") && prompt.includes("Motion character:"));
  await page.getByLabel("Camera movement").selectOption("orbit");
  prompt = await page.locator("#prompt").inputValue();
  check("camera selection reflected", prompt.includes("a slow orbit around the subject"));
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
  await page.getByText("Restyle existing", { exact: true }).click();
  await page.locator("label").filter({ hasText: /^Background$/ }).click();
  await page.getByLabel("Lighting", { exact: true }).selectOption("golden-hour");
  const before = await page.locator("#prompt").inputValue();
  await page.getByRole("button", { name: "Copy share link" }).click();
  const link = await clip();
  const p2 = await ctx.newPage();
  await p2.goto(link, { waitUntil: "networkidle" });
  check("share link restores identical prompt", (await p2.locator("#prompt").inputValue()) === before, link);
  await p2.close();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Reset builder" }).click();
  await page.waitForTimeout(200);
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
  await page.getByRole("tab", { name: "Image", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  check("tabs arrow-key navigation", (await page.getByRole("tab", { name: "Video" }).getAttribute("aria-selected")) === "true");
  // mobile menu
  const m = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await m.goto(BASE + "/", { waitUntil: "networkidle" });
  await m.getByRole("button", { name: "Menu" }).click();
  await m.locator("#mobile-nav").getByRole("link", { name: "Palettes" }).click();
  await m.waitForURL(/\/palettes/);
  check("mobile menu navigates and closes", !(await m.locator("#mobile-nav").isVisible()));
});

await step("leave warning", async () => {
  await page.goto(BASE + "/builder?s=memphis", { waitUntil: "networkidle" });
  await page.locator("#prompt").fill("edited text");
  await page.locator("header nav").getByRole("link", { name: "Styles" }).click();
  const dlg = page.getByRole("dialog", { name: "Leave with unsaved edits?" });
  await dlg.waitFor({ timeout: 3000 });
  check("in-app navigation with edits asks first", await dlg.isVisible());
  await page.getByRole("button", { name: "Cancel" }).click();
  check("cancel stays on builder with edits", page.url().includes("/builder") && (await page.locator("#prompt").inputValue()) === "edited text");
  await page.locator("header nav").getByRole("link", { name: "Styles" }).click();
  await page.getByRole("button", { name: "Leave and discard" }).click();
  await page.waitForURL(/\/styles$/);
  check("confirm leaves", true);
});

check("no console errors during journeys", errors.length === 0, errors.join(" | "));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
