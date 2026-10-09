import { describe, expect, it } from "vitest";
import { decodeState, defaultState } from "../prompt/state";
import { imageActor } from "../scene/model";
import { checkBrief, checkSet, quoted, stripSlop, subjectNames, textSources, tidyBrief, typedWords, type Brief } from "./brief";

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

  it("treats each line of the text box as its own block of copy", () => {
    const copy = { ...defaultState(), text: "TRANSPORT • LOGISTICS\n  JOHOR • SINGAPORE  \n\nseyon_services@yahoo.com" };
    expect(typedWords(copy)).toEqual(["TRANSPORT • LOGISTICS", "JOHOR • SINGAPORE", "seyon_services@yahoo.com"]);
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

  it("counts the words in a text-source image as the visitor's, without letting them be invented", () => {
    const withSource = { ...defaultState(), style: "blueprint", actors: [imageActor({ key: "k", ratio: 1, use: "text" }, [])] };
    expect(textSources(withSource)).toEqual(["image 1"]);
    const lettered = brief({ hero: { subject: null, treatment: "a technical drawing", scale: null }, furniture: [], type: "the words from image 1 as small stencil capitals along the base", craft: ["vector-flat", "edge-tension"] });
    expect(checkBrief(lettered, withSource)).toEqual([]);
    expect(checkBrief({ ...lettered, type: '"SEYON TRANSPORT" along the base' }, withSource).join(" ")).toMatch(/isn't one of the visitor's words/);
    // A picture with no role and no comment is not a text source.
    expect(textSources({ ...withSource, actors: [imageActor({ key: "k", ratio: 1 }, [])] })).toEqual([]);
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

  it("lets supporting elements frame the visitor's own copy, but not carry new text", () => {
    expect(checkBrief(brief({ furniture: ["a small rust red tab in the top right corner holding the price", "a heavy black bar behind the footer text", "a torn strip as a dark rest for the detail words", "a ticket-shaped scrap holding the free-entry words"] }), punk)).toEqual([]);
    expect(checkBrief(brief({ furniture: ["a price tag on the shoe"] }), punk).join(" ")).toMatch(/carries words/);
    expect(checkBrief(brief({ furniture: ["random numbers down the edge"] }), punk).join(" ")).toMatch(/carries words/);
    expect(checkBrief(brief({ furniture: ["a banner reading the headline"] }), punk).join(" ")).toMatch(/carries words/);
  });

  it("reads design acronyms (HUD, CRT, VHS) as vocabulary, not printed words", () => {
    expect(checkBrief(brief({ furniture: ["a framed HUD box lower right", "a thin strip of CRT scanlines across the top", "VHS tracking noise along the base", "an RGB split on the edges"] }), punk)).toEqual([]);
    expect(checkBrief(brief({ furniture: ["a sticker shouting SALE"] }), punk).join(" ")).toMatch(/carries words/);
  });

  it("accepts furniture that says it has no words", () => {
    expect(checkBrief(brief({ furniture: ["older torn scraps peeking out under the flyer edges, with no readable words", "blank paper tags without text"] }), punk)).toEqual([]);
    expect(checkBrief(brief({ furniture: ["a sticker with words on it"] }), punk).join(" ")).toMatch(/carries words/);
  });

  it("lets the visitor's own phrase be split into its words, but not changed", () => {
    expect(checkBrief(brief({ type: '"Night" stacked over "Shift", huge, left edge' }), punk)).toEqual([]);
    expect(checkBrief(brief({ type: '"Night Shift" and "Day" ' }), punk).join(" ")).toMatch(/"Day" isn't one of the visitor's words/);
    expect(checkBrief(brief({ type: '"Nig" huge' }), punk).join(" ")).toMatch(/isn't one of the visitor's words/);
  });

  it("accepts a rich concept: many supporting elements and no craft ids", () => {
    const rich = brief({ furniture: ["thin callout lines to the dancer's feet", "a sizing grid bottom-left", "a ghosted second dancer mid-step", "motion streaks behind her", "a halftone shadow", 'a stamp holding "Night Shift"'], craft: [] });
    expect(checkBrief(rich, punk)).toEqual([]);
  });

  it("treats craft as optional vocabulary, but still rejects unknown ids", () => {
    expect(checkBrief(brief({ craft: ["tape-strips"] }), punk)).toEqual([]);
    expect(checkBrief(brief({ craft: ["torn-split", "made-up"] }), punk).join(" ")).toMatch(/Unknown craft ids: made-up/);
  });

  it("keeps a restyle to treatment, colour and finish", () => {
    const restyle = decodeState(new URLSearchParams("s=pop-art&t=restyle")).state;
    const ok = brief({ hero: { subject: null, treatment: "Ben-Day dots over the whole picture", scale: null }, device: null, furniture: [], type: null, colour: "flat primaries", craft: ["halftone-screen"] });
    expect(checkBrief(ok, restyle)).toEqual([]);
    expect(checkBrief({ ...ok, device: "torn split" }, restyle).join(" ")).toMatch(/restyle keeps/);
    expect(checkBrief({ ...ok, craft: [] }, restyle)).toEqual([]);
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
