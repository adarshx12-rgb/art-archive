import { describe, expect, it } from "vitest";
import { decodeState } from "../src/lib/prompt/state";
import { newActor } from "../src/lib/scene/model";
import { designCoverage, designIntent, designMemoryFor, designReferences, retrieveReferences, type StudiedReference } from "./design-memory";
import { StudySchema } from "./design-memory-schema";

const state = (query: string) => decodeState(new URLSearchParams(query)).state;
const reference = (id: string, patch: Partial<StudiedReference> = {}): StudiedReference => ({
  id, imageHash: id, sources: [{ path: `swiss/${id}.jpg`, folder: "swiss", sha256: "a".repeat(64), width: 600, height: 800 }],
  model: "fixture", studiedAt: "2026-10-06", summary: "A quiet photograph of a cat placed in a wide open field.",
  tags: ["cat", "photograph", "negative space", "asymmetric"], medium: "photograph", structure: "single-focus", density: "sparse", hasText: false,
  composition: "Small cat at the lower left with wide empty space above.", hierarchy: "Isolation makes the small subject read first.", typography: null,
  palette: "A pale ground contrasts with a dark subject.", imageTreatment: "Smooth tonal photographic rendering.", finish: "Clean surface without visible print wear.",
  lessons: [{ principle: "Use empty space to isolate a small subject.", evidence: "The cat occupies one corner of the field.", why: "Contrast draws attention without an enormous crop.", adapt: "Reserve a wide open field around the new subject.", caution: "Avoid this move when the brief requires a dense scene." }],
  pitfalls: ["Adding unrelated decorative marks dilutes the isolation."], confidence: "high", uncertainty: "", ...patch,
});

describe("reference retrieval", () => {
  it("prefers relevant same-style art and does not count duplicate files as different ideas", () => {
    const cat = reference("cat");
    const duplicates = [cat, { ...cat, id: "duplicate" }];
    const unrelated = reference("horror", { sources: [{ ...cat.sources[0]!, folder: "gothic" }], tags: ["horror", "blackletter"], summary: "An ornate blackletter composition with heavy decoration." });
    const picked = retrieveReferences(state("s=swiss&q=a+cat"), [...duplicates, unrelated]);
    expect(picked[0]!.reference.id).toBe("cat");
    expect(picked.filter((p) => p.reference.imageHash === "cat")).toHaveLength(1);
    expect(picked[0]!.transfer).toBe("within-style");
  });

  it("retrieves spatial lessons for custom briefs without importing another style's finish", () => {
    const s = state("s=custom&cs=quiet+cat+photography+with+wide+negative+space&q=a+cat");
    const result = retrieveReferences(s, [reference("cat")]);
    expect(result[0]!.transfer).toBe("structure-only");
  });

  it("understands repeated words as a pattern rather than a hierarchy of titles", () => {
    const s = state("s=custom&tx=what+the+chat&cs=equal+diagonal+repetition");
    s.actors = Array.from({ length: 3 }, () => newActor("text", "what the chat", []));
    expect(designIntent(s)).toMatchObject({ structure: "repetition", medium: "typography", layout: "preserve" });
    const pattern = reference("pattern", { structure: "repetition", medium: "typography", summary: "Equal diagonal repetition across the field.", tags: ["repeat", "diagonal", "equal", "type"] });
    const title = reference("title", { structure: "type-led", medium: "typography", summary: "A title above a smaller text field.", tags: ["headline", "type", "diagonal", "equal"] });
    expect(retrieveReferences(s, [title, pattern])[0]!.reference.id).toBe("pattern");
  });

  it("does not treat things the user forbids as the requested visual direction", () => {
    expect(designIntent(state("s=custom&cs=Quiet+photography.+No+dense+repeating+wallpaper."))).toMatchObject({ density: "sparse", structure: null, medium: "photograph" });
  });

  it("returns no evidence for an unrelated empty collection", () => {
    expect(retrieveReferences(state("s=custom&cs=translucent+glass+sculpture"), [reference("cat")])).toEqual([]);
  });

  it("keeps source composition and colours above reference suggestions", () => {
    expect(designIntent(state("s=pop-art&t=restyle&k=composition-colours"))).toMatchObject({ layout: "preserve", palette: "source colours" });
  });

  it("bounds runtime context and omits typography guidance for wordless briefs", () => {
    const memory = designMemoryFor(state("s=grunge&q=a+boxer"));
    expect(memory.references.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(memory.references).length).toBeLessThanOrEqual(14000);
    expect(memory.references.every((r) => !("typography" in r))).toBe(true);
    expect(memory.references.filter((r) => r.transfer === "structure-only").every((r) => !("finish" in r) && !("palette" in r))).toBe(true);
  });
});

describe("studied collection integrity", () => {
  it("covers every inventoried image with validated observations and provenance", () => {
    expect(designCoverage.missing).toEqual([]);
    expect(designCoverage.failures).toEqual([]);
    expect(designCoverage.studiedFiles).toBe(designCoverage.files);
    expect(designReferences.length).toBe(designCoverage.uniqueImages);
    expect(new Set(designReferences.map((r) => r.imageHash)).size).toBe(designReferences.length);
    const files = designReferences.flatMap((r) => r.sources.map((s) => s.path));
    expect(new Set(files).size).toBe(designCoverage.files);
    for (const r of designReferences) {
      expect(StudySchema.safeParse(r).success, r.id).toBe(true);
      expect(r.sources.every((s) => /^[a-f0-9]{64}$/.test(s.sha256) && s.width > 0 && s.height > 0)).toBe(true);
    }
  });
});
