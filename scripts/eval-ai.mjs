// Scores the AI endpoints against fixed test cases. Every run calls the model
// and costs money (roughly $0.02-0.04 per case with Claude Sonnet 5).
//
// Usage: put ANTHROPIC_API_KEY in .dev.vars, run `npm run dev` in one
// terminal, then `npm run eval:ai` (BASE=http://localhost:5173 by default).

const BASE = process.env.BASE || "http://localhost:5173";
const post = async (path, body) => {
  const res = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${data.error}`);
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
console.log(`\n${pass}/${total} checks passed (${Math.round((pass / total) * 100)}%)`);
