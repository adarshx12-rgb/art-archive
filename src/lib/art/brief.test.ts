import { describe, expect, it } from "vitest";
import { decodeState } from "../prompt/state";
import { checkBrief, checkSet, quoted, stripSlop, subjectNames, tidyBrief, typedWords, type Brief } from "./brief";

const punk = decodeState(new URLSearchParams("s=punk&fm=poster&tx=Night%20Shift&sc=" + encodeURIComponent("person~woman dancing~0~0~0~0~0~0~1~dance~1"))).state;
const brief = (patch: Partial<Brief> = {}): Brief => ({
  title: "Torn in two",
  idea: "The dancer blown up huge and ripped down the middle.",
  hero: { subject: "woman dancing", treatment: "photocopied huge, solid blacks", scale: "cropped at the knees" },
  device: "torn top to bottom just left of centre",
  furniture: ["two strips of masking tape across the tear"],
  type: '"Night Shift" in ransom letters across the tear',
  colour: null,
  finish: "toner specks",
  craft: ["photocopy-blowup", "torn-split", "tape-strips", "photocopy-contrast"],
  motion: null,
  ...patch,
});

describe("the visitor's words and subjects", () => {
  it("collects typed words and subject labels", () => {
    expect(typedWords(punk)).toEqual(["Night Shift"]);
    expect(subjectNames(punk)).toEqual(["woman dancing"]);
  });

  it("finds straight and curly quoted text", () => {
    expect(quoted('a "Night Shift" title and “Doors” sign')).toEqual(["Night Shift", "Doors"]);
  });
});

describe("checkBrief", () => {
  it("accepts a brief that keeps to the visitor's facts", () => {
    expect(checkBrief(brief(), punk)).toEqual([]);
  });

  it("rejects a hero that isn't one of the visitor's subjects", () => {
    expect(checkBrief(brief({ hero: { subject: "a dragon", treatment: "x", scale: null } }), punk).join(" ")).toMatch(/hero must be one of/);
  });

  it("matches the hero loosely, ignoring case and articles", () => {
    expect(checkBrief(brief({ hero: { subject: "The Woman Dancing", treatment: "x", scale: null } }), punk)).toEqual([]);
  });

  it("with no subjects, the hero must be null", () => {
    const words = decodeState(new URLSearchParams("s=kidcore&fm=flyer&tx=Maya%20turns%2030")).state;
    expect(checkBrief(brief({ hero: { subject: null, treatment: "giant marker numerals", scale: null }, type: '"Maya turns 30" huge' }), words)).toEqual([]);
    expect(checkBrief(brief({ hero: { subject: "a cake", treatment: "x", scale: null }, type: '"Maya turns 30" huge' }), words).join(" ")).toMatch(/no subjects/);
  });

  it("matches the hero on whole words, not letters", () => {
    const man = decodeState(new URLSearchParams("s=punk&fm=poster&sc=" + encodeURIComponent("person~man~0~0~0~0~0~0~1~stand~1"))).state;
    expect(checkBrief(brief({ hero: { subject: "woman", treatment: "x", scale: null }, type: null }), man).join(" ")).toMatch(/hero must be one of/);
  });

  it("rejects a hero that adds objects to the visitor's subject", () => {
    expect(checkBrief(brief({ hero: { subject: "woman dancing with a red dragon on a motorbike", treatment: "x", scale: null } }), punk).join(" ")).toMatch(/hero must be one of/);
    expect(checkBrief(brief({ hero: { subject: "the dancing woman", treatment: "x", scale: null } }), punk)).toEqual([]);
  });

  it("with no typed words, allows no lettering and no lettering devices", () => {
    const silent = decodeState(new URLSearchParams("s=swiss&fm=poster")).state;
    const graphic = brief({ hero: { subject: null, treatment: "flat red circle", scale: null }, type: null, furniture: [], craft: ["vector-flat", "edge-tension"] });
    expect(checkBrief(graphic, silent)).toEqual([]);
    expect(checkBrief({ ...graphic, type: "a giant stacked headline at top" }, silent).join(" ")).toMatch(/typed no words/);
    expect(checkBrief({ ...graphic, craft: ["vector-flat", "giant-glyph"] }, silent).join(" ")).toMatch(/needs lettering: giant-glyph/);
  });

  it("treats single-quoted text as words", () => {
    expect(quoted("a 'SALE' sign, the artist's ‘big’ day, rock 'n' roll")).toEqual(["SALE", "big"]);
    expect(checkBrief(brief({ type: "'SALE' in huge letters" }), punk).join(" ")).toMatch(/"SALE" isn't one of the visitor's words/);
  });

  it("rejects furniture with prices, dates or capitalised words", () => {
    for (const f of ["a price tag $9.99", "date stamp 1984", "a stamp: SALE", "a stamp with the year"]) {
      expect(checkBrief(brief({ furniture: [f] }), punk).join(" ")).toMatch(/carries words/);
    }
    expect(checkBrief(brief({ furniture: ["a faded circular rubber-stamp ring", "small registration marks bottom-right"] }), punk)).toEqual([]);
  });

  it("rejects quoted words the visitor didn't type", () => {
    expect(checkBrief(brief({ type: '"Night Shift" and "doors at ten"' }), punk).join(" ")).toMatch(/"doors at ten" isn't one of the visitor's words/);
  });

  it("rejects furniture that carries words", () => {
    expect(checkBrief(brief({ furniture: ["a badge saying open late"] }), punk).join(" ")).toMatch(/carries words/);
    expect(checkBrief(brief({ furniture: ["barcode with text under it"] }), punk).join(" ")).toMatch(/carries words/);
    expect(checkBrief(brief({ furniture: ['a pill badge holding "Night Shift"'] }), punk)).toEqual([]);
  });

  it("allows at most three furniture items", () => {
    expect(checkBrief(brief({ furniture: ["a", "b", "c", "d"].map((x) => `tape ${x}`) }), punk).join(" ")).toMatch(/at most 3/);
  });

  it("needs a technique or device from the library, and known ids", () => {
    expect(checkBrief(brief({ craft: ["tape-strips"] }), punk).join(" ")).toMatch(/technique or device/);
    expect(checkBrief(brief({ craft: ["torn-split", "made-up"] }), punk).join(" ")).toMatch(/Unknown craft ids: made-up/);
  });

  it("keeps a restyle to treatment, colour and finish", () => {
    const restyle = decodeState(new URLSearchParams("s=pop-art&t=restyle")).state;
    const ok = brief({ hero: { subject: null, treatment: "Ben-Day dots over the whole picture", scale: null }, device: null, furniture: [], type: null, colour: "flat primaries", craft: ["halftone-screen"] });
    expect(checkBrief(ok, restyle)).toEqual([]);
    expect(checkBrief({ ...ok, device: "torn split" }, restyle).join(" ")).toMatch(/restyle keeps/);
    expect(checkBrief({ ...ok, craft: ["torn-split"] }, restyle).join(" ")).toMatch(/at least one technique/);
  });
});

describe("checkSet", () => {
  it("flags concepts that repeat an earlier technique and device", () => {
    const a = brief();
    const b = brief({ title: "Other", craft: ["halftone-screen", "cutout-window"] });
    expect(checkSet([a, b])).toEqual([]);
    expect(checkSet([a, b, brief({ title: "Same again" })])).toEqual([2]);
  });
});

describe("tidyBrief", () => {
  it("trims, empties blanks and de-duplicates craft ids", () => {
    const t = tidyBrief(brief({ title: "  Torn  ", device: "  ", furniture: [" tape ", ""], craft: ["torn-split", "torn-split"] }));
    expect(t).toMatchObject({ title: "Torn", device: null, furniture: ["tape"], craft: ["torn-split"] });
  });
});

describe("stripSlop", () => {
  it("removes filler words and tidies the punctuation they leave", () => {
    expect(stripSlop("A stunning, vibrant poster of a fox, highly detailed.", "")).toBe("A poster of a fox.");
    expect(stripSlop("Masterpiece. A fox in 8k.", "")).toBe("A fox in.");
  });

  it("never strips words inside quotes or words in the facts", () => {
    expect(stripSlop('Lettering "Epic Night" in red. An epic dragon.', "An image of an epic dragon")).toBe('Lettering "Epic Night" in red. An epic dragon.');
  });
});
