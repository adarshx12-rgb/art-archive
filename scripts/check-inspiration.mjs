// Read-only coverage check against the current originals; makes no API calls.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { StudySchema } from "../worker/design-memory-schema.ts";
const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "inspiration");
const memory = JSON.parse(await fs.readFile(path.join(root, "worker/data/design-memory.json"), "utf8"));
const sources = new Map();
const hashes = new Set();
for (const reference of memory.references) {
  StudySchema.parse(reference);
  if (hashes.has(reference.imageHash)) throw new Error(`Duplicate study: ${reference.id}`);
  hashes.add(reference.imageHash);
  for (const source of reference.sources) {
    if (sources.has(source.path)) throw new Error(`Duplicate source: ${source.path}`);
    sources.set(source.path, source);
  }
}
const actual = new Set();
async function walk(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    if (entry.name === ".study") continue;
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) { await walk(full); continue; }
    if (!/\.(jpe?g|png|webp)$/i.test(entry.name)) continue;
    const relative = path.relative(directory, full).split(path.sep).join("/");
    const sha256 = crypto.createHash("sha256").update(await fs.readFile(full)).digest("hex");
    actual.add(relative);
    if (sources.get(relative)?.sha256 !== sha256) throw new Error(`Unstudied or changed image: ${relative}. Run npm run inspiration:refresh.`);
  }
}
await walk(directory);
for (const source of sources.keys()) if (!actual.has(source)) throw new Error(`Removed image still in memory: ${source}`);
if (actual.size !== memory.coverage.files || hashes.size !== memory.coverage.uniqueImages || memory.coverage.missing.length || memory.coverage.failures.length) throw new Error("Coverage counts do not reconcile");
console.log(`PASS: all ${actual.size} files are covered by ${hashes.size} validated visual studies; no missing, changed or stale sources.`);
