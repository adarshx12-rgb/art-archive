/**
 * Check every design template, free (no model calls):
 *
 *   npm run templates            all templates
 *   npm run templates -- y2k     one style
 *
 * Runs the same checks as the generator (on the canvas, safe area, no text on
 * text, contrast, fit, what the format needs) and asks Google Fonts whether
 * each family exists at the weight used. Writes docs/templates-report.md and
 * exits non-zero when anything fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url);
const { styles } = await jiti.import("../src/content/styles/index.ts");
const { TEMPLATE_FORMATS, styleColours } = await jiti.import("../src/content/templates.ts");
const { checkTemplate } = await jiti.import("../src/lib/templates/check.ts");

const only = process.argv[2];
const all = JSON.parse(fs.readFileSync(path.join(ROOT, "src/content/templates.generated.json"), "utf8"));
const bySlug = new Map(styles.map((s) => [s.slug, s]));

const fontCache = new Map();
function fontExists(family, weight = 400, italic = false) {
  const key = `${family}|${weight}|${italic}`;
  if (!fontCache.has(key)) {
    const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${axis}`;
    fontCache.set(key, fetch(url).then((r) => r.ok).catch(() => false));
  }
  return fontCache.get(key);
}

const rows = [];
let failed = 0;
for (const t of all) {
  if (only && t.style !== only) continue;
  const style = bySlug.get(t.style);
  const issues = style ? checkTemplate(t, styleColours(style)).map((i) => i.message) : [`Unknown style "${t.style}".`];
  for (const b of t.blocks) {
    if (b.font && !(await fontExists(b.font, b.weight ?? 400, b.italic ?? false))) issues.push(`"${b.font}" ${b.weight ?? 400}${b.italic ? " italic" : ""} is not on Google Fonts.`);
  }
  if (issues.length) failed++;
  rows.push({ tag: `${t.style}/${t.format}`, name: t.name, issues });
}

const have = new Set(all.map((t) => `${t.style}/${t.format}`));
const missing = styles.flatMap((s) => TEMPLATE_FORMATS.filter((f) => !have.has(`${s.slug}/${f.id}`)).map((f) => `${s.slug}/${f.id}`));
const withAny = new Set(all.map((t) => t.style));

const report = [
  "# Design templates",
  "",
  `${rows.length} checked · ${failed} with issues · ${withAny.size} of ${styles.length} styles have templates. Run \`npm run templates\` to refresh.`,
  "",
  "| Template | Layout | Issues |",
  "|---|---|---|",
  ...rows.map((r) => `| ${r.tag} | ${r.name} | ${r.issues.join("<br>") || "—"} |`),
  "",
  `Missing for styles that have some templates: ${missing.filter((m) => withAny.has(m.split("/")[0])).join(", ") || "none"}.`,
  "",
];
if (!only) fs.writeFileSync(path.join(ROOT, "docs/templates-report.md"), report.join("\n"));
for (const r of rows) if (r.issues.length) console.log(`✗ ${r.tag}\n  ${r.issues.join("\n  ")}`);
console.log(`${rows.length} checked, ${failed} with issues.`);
process.exit(failed ? 1 : 0);
