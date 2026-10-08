import { describe, expect, it } from "vitest";
import { composePrompt, resolvePalette, themePrompt } from "./compose";
import { COPY_LINES, COPY_MAX, decodeState, defaultState, encodeState, MAX_COMMENTS, type BuilderState } from "./state";
import { projectScene, shotCamera } from "../scene/camera";
import { getStyle } from "../../content/styles";
import { imageActor, newActor, type Actor, type ImageUse, type Vec3 } from "../scene/model";
import { applyLayerEdit } from "../scene/convert";

const state = (patch: Partial<BuilderState> = {}): BuilderState => ({
  ...defaultState(),
  style: "steampunk",
  subject: "a lighthouse keeper reading by a window",
  ...patch,
});

describe("composePrompt", () => {
  it("is deterministic", () => {
    expect(composePrompt(state()).prompt).toBe(composePrompt(state()).prompt);
  });

  it("includes subject, concrete cues and the style palette", () => {
    const { prompt } = composePrompt(state());
    expect(prompt).toContain("An image of a lighthouse keeper reading by a window, in the Steampunk style.");
    expect(prompt).toContain("brass gears");
    expect(prompt).toMatch(/Colour palette: .*#2A1E17.*about 60%/);
    expect(prompt).toMatch(/warm gaslight/);
    expect(prompt).not.toContain("Camera:");
  });

  it("uses a placeholder and a note when the subject is empty", () => {
    const r = composePrompt(state({ subject: "   " }));
    expect(r.prompt).toContain("[describe your subject]");
    expect(r.notes.join(" ")).toMatch(/Add a subject/);
  });

  it("preserves repeated lettering as placed elements, with size and signed rotation", () => {
    const s = state({ subject: "", aspect: "4:5", view: "2d" });
    const camera = shotCamera(s);
    s.actors = [0.2, 0.4].map((y) => {
      const text = { ...newActor("text", "what the chat", []), scale: 0.46, stretch: 1.2 };
      return applyLayerEdit(camera, text, { x: 0.25, y, rotation: -20 });
    });
    const { prompt, notes } = composePrompt(s);
    expect(prompt).toContain("An image of a typography composition");
    expect(prompt).not.toContain("[describe your subject]");
    expect(notes.join(" ")).not.toContain("Add a subject");
    expect(prompt).toContain("Text layout: exactly 2 placed text elements");
    expect(prompt).toContain('Text element 1: "what the chat"; centre 25% from the left and 20% from the top; unrotated width 96.7%');
    expect(prompt).toContain("letter height 8% of the frame height; 20 degrees counterclockwise (rising to the right)");
    expect(prompt).toContain("centre 25% from the left and 40% from the top");
    expect(prompt).not.toContain("small in the distance");
    expect(prompt).not.toContain("Composition:");
    s.task = "restyle";
    s.preserve = ["composition"];
    expect(composePrompt(s).prompt).not.toContain("Text layout:");
  });

  it("scales the number of cues with intensity", () => {
    const style = getStyle("steampunk")!;
    const subtle = composePrompt(state({ intensity: "subtle" })).prompt;
    const strong = composePrompt(state({ intensity: "strong" })).prompt;
    expect(subtle).toContain("a light touch");
    expect(subtle).not.toContain(style.prompt.cues[2]!.toLowerCase());
    expect(strong.toLowerCase()).toContain(style.prompt.cues[4]!.toLowerCase());
    expect(strong).toContain("fully committed");
  });

  it("adds video duration, camera and motion only for video", () => {
    const { prompt } = composePrompt(state({ output: "video", duration: 10, camera: "orbit", movement: "dynamic" }));
    expect(prompt).toContain("A 10-second video of");
    expect(prompt).toContain("Camera: a slow orbit around the subject.");
    expect(prompt).toContain("Subject motion: energetic");
    expect(prompt).toContain("Motion character: gears turning");
    expect(prompt).toContain("Duration: about 10 seconds");
  });

  it("changes when the output switches between image and video", () => {
    expect(composePrompt(state({ output: "image" })).prompt).not.toBe(
      composePrompt(state({ output: "video" })).prompt,
    );
  });

  it("uses curated palette colours and roles", () => {
    const { prompt } = composePrompt(state({ paletteMode: "curated", palette: "acid-night" }));
    expect(prompt).toContain("rave black (#0C0C0C) as the background and dominant field, about 75%");
    expect(prompt).toContain("acid green (#C4FF2E) as the primary colour, about 25%");
  });

  it("treats a 1-colour palette as the background only", () => {
    const { prompt } = composePrompt(state({ paletteMode: "custom", count: 1, custom: ["#F1EDE4", "#000000", "#000000", "#000000"] }));
    expect(prompt).toMatch(/Colour palette: .* \(#F1EDE4\) as the background; the other colours follow the style\./);
    expect(prompt).not.toContain("Keep the image within this palette");
    expect(prompt).not.toContain("#000000");
  });

  it("round-trips a 1-colour palette in a share link", () => {
    const s = state({ paletteMode: "custom", count: 1, custom: ["#F1EDE4", "#000000", "#000000", "#000000"] });
    const { state: back, issues } = decodeState(new URLSearchParams(encodeState(s).toString()));
    expect(issues).toEqual([]);
    expect(back.count).toBe(1);
    expect(back.paletteMode).toBe("custom");
    expect(back.custom[0]).toBe("#F1EDE4");
  });

  it("uses exactly `count` custom colours with described names", () => {
    const s = state({ paletteMode: "custom", count: 2, custom: ["#0A2E5C", "#F5D0C5", "#000000", "#FFFFFF"] });
    const pal = resolvePalette(s, getStyle("steampunk")!);
    expect(pal.colours).toHaveLength(2);
    const { prompt } = composePrompt(s);
    expect(prompt).toContain("#0A2E5C");
    expect(prompt).toContain("#F5D0C5");
    expect(prompt).not.toContain("#000000");
  });

  it("drops colour-related 'avoid' items when the user picks their own palette", () => {
    const def = composePrompt(state({ style: "steampunk" })).prompt;
    const custom = composePrompt(state({ style: "steampunk", paletteMode: "custom" })).prompt;
    expect(def).toContain("neon");
    expect(custom).not.toMatch(/Avoid:.*neon/);
  });

  it("restyle: preserving composition removes composition and aspect instructions", () => {
    const { prompt } = composePrompt(state({ task: "restyle", preserve: ["composition", "identity"], aspect: "16:9" }));
    expect(prompt).toContain("Restyle the provided image in the Steampunk style.");
    expect(prompt).not.toContain("Composition:");
    expect(prompt).not.toContain("16:9");
    expect(prompt).toMatch(/Preserve: the identity.*original composition/);
  });

  it("adds camera and film setup lines only when set", () => {
    expect(composePrompt(state()).prompt).not.toMatch(/Shot:|Film setup:/);
    const { prompt } = composePrompt(state({ shot: "medium", angle: "low", lens: "35", genre: "thriller", era: "1970s" }));
    expect(prompt).toContain("Shot: a medium shot framing the subject from the waist up, from a low angle looking up, on a 35mm lens");
    expect(prompt).toContain("Film setup: the tense, suspenseful tone of a thriller, set in the 1970s");
    expect(composePrompt(state({ lens: "85" })).prompt).toContain("Shot: shot on an 85mm portrait lens");
  });

  it("drops camera settings when the source composition is preserved", () => {
    const r = composePrompt(state({ task: "restyle", preserve: ["composition"], shot: "close-up" }));
    expect(r.prompt).not.toContain("Shot:");
    expect(r.notes.join(" ")).toMatch(/camera settings are not used/);
  });

  it("opens on the 2D board and keeps a chosen 3D view in the share link", () => {
    expect(defaultState().view).toBe("2d");
    expect(decodeState(new URLSearchParams("s=swiss")).state.view).toBe("2d");
    const back = decodeState(new URLSearchParams(encodeState(state({ view: "3d" })).toString())).state;
    expect(back.view).toBe("3d");
  });

  it("names the chosen format in the prompt and keeps it in the share link", () => {
    const s = state({ format: "poster", aspect: "2:3" });
    expect(composePrompt(s).prompt).toContain("Format: a poster, one big idea, readable from across a room.");
    expect(composePrompt(state()).prompt).not.toContain("Format:");
    const back = decodeState(new URLSearchParams(encodeState(s).toString()));
    expect(back.issues).toEqual([]);
    expect(back.state.format).toBe("poster");
    expect(decodeState(new URLSearchParams("s=swiss&fm=banana")).state.format).toBeNull();
  });

  it("turns comments into notes tied to what's under them", () => {
    const boat = { ...newActor("boat", "boat", []), position: [0.5, 0, -6] as Vec3 };
    const s = state({ subject: "", actors: [boat] });
    const on = projectScene(shotCamera(s), [boat])[0]!;
    const withNotes = state({
      subject: "",
      actors: [boat],
      comments: [
        { id: "a", x: on.x, y: on.y, text: "make the boat old pirate type" },
        { id: "b", x: 0.1, y: 0.1, text: "a stormy sky here" },
        { id: "c", x: 0.5, y: 0.5, text: "   " },
      ],
    });
    const { prompt } = composePrompt(withNotes);
    expect(prompt).toContain("Instructions from the user (carry out each one): 1) the boat: make the boat old pirate type; 2) the upper left of the frame: a stormy sky here.");
    expect(composePrompt(s).prompt).not.toContain("Instructions from the user");
  });

  it("keeps several lines of copy through a share link, cleaned and capped", () => {
    const long = Array.from({ length: 20 }, (_, i) => `line ${i}\u0007`).join("\n");
    const back = decodeState(new URLSearchParams(encodeState(state({ text: `HEADLINE\n\n  sub line  \n${long}` })).toString())).state;
    const lines = back.text.split("\n");
    expect(lines.slice(0, 3)).toEqual(["HEADLINE", "sub line", "line 0"]);
    expect(lines).toHaveLength(COPY_LINES);
    expect(back.text.length).toBeLessThanOrEqual(COPY_MAX);
    const { prompt } = composePrompt(state({ text: "HEADLINE\nsub line" }));
    expect(prompt).toContain('Lettering: set exactly these texts: "HEADLINE" and "sub line"');
  });

  it("keeps comments in the share link, cleaned and capped", () => {
    const comments = Array.from({ length: 15 }, (_, i) => ({ id: String(i), x: 0.25, y: 0.75, text: `note ${i} ~ with | marks` }));
    const back = decodeState(new URLSearchParams(encodeState(state({ comments })).toString()));
    expect(back.issues).toEqual([]);
    expect(back.state.comments).toHaveLength(MAX_COMMENTS);
    expect(back.state.comments[0]).toMatchObject({ x: 0.25, y: 0.75, text: "note 0 with marks" });
    expect(decodeState(new URLSearchParams("s=swiss&nt=0.5~0.5~")).state.comments).toEqual([]);
    expect(decodeState(new URLSearchParams("s=swiss&nt=9~-3~hello")).state.comments[0]).toMatchObject({ x: 1, y: 0, text: "hello" });
  });

  describe("reference images", () => {
    const base = state({ subject: "", aspect: "4:5" });
    const cam = shotCamera(base);
    const man = { ...newActor("person", "man", []), id: "man", position: [0, 0, 0] as Vec3 };
    const onMan = projectScene(cam, [man])[0]!;
    const top = onMan.y - onMan.size / 2;
    /** An image dropped at a point of the frame, small, like a sticker. */
    const at = (x: number, y: number, use?: ImageUse, n = 0) => {
      const img = { ...imageActor({ key: `k${n}`, ratio: 1, use }, [man]), id: `img${n}`, label: `image ${n || 1}`, scale: 0.15 };
      return applyLayerEdit(cam, img, { x, y });
    };
    const lines = (actors: Actor[]) => composePrompt({ ...base, actors }).prompt;

    it("an image over a figure's head becomes that figure's face", () => {
      const p = lines([man, at(onMan.x, top + onMan.size * 0.08)]);
      expect(p.startsWith("An image of a man,")).toBe(true);
      expect(p).toContain("Attach image 1 with this prompt.");
      expect(p).toMatch(/Image 1: the man's face\. Keep the exact likeness/);
      expect(p).toContain("do not beautify, idealise, replace or stylise away the identity");
    });

    it("a logo is reproduced exactly and blended onto what it sits on", () => {
      const p = lines([man, at(onMan.x, top + onMan.size * 0.4, "logo")]);
      expect(p).toMatch(/Image 1: a logo or symbol on the man\. Reproduce it exactly/);
      expect(p).toContain("do not redraw, restyle, simplify or add to it");
      expect(p).toContain("matching the scene's lighting, perspective and surface");
    });

    it("a product keeps its exact look; a look-only image lends just its look", () => {
      expect(lines([man, at(0.85, 0.85, "product")])).toMatch(/Image 1: a product or object, exactly as it appears[^.]*\./);
      const look = lines([man, at(0.1, 0.1, "look")]);
      expect(look).toContain("Image 1: use only its look (colours, mood, texture); do not copy what it shows.");
    });

    it("lists several images in order", () => {
      const p = lines([man, at(onMan.x, top + onMan.size * 0.08, undefined, 1), at(0.1, 0.1, "look", 2)]);
      expect(p).toContain("Attach images 1 and 2 with this prompt, in this order.");
      expect(p.indexOf("Image 1:")).toBeLessThan(p.indexOf("Image 2:"));
    });

    it("keeps the chosen use in a share link", () => {
      const back = decodeState(new URLSearchParams(encodeState({ ...base, actors: [man, at(0.5, 0.5, "logo")] }).toString())).state;
      expect(back.actors.find((a) => a.glyph === "image")?.image?.use).toBe("logo");
    });

    it("a text source lends its words, set in the style, not its layout or colours", () => {
      const p = lines([man, at(0.85, 0.85, "text")]);
      expect(p).toMatch(/Image 1: a source of text\. Use its words exactly/);
      expect(p).toContain("do not copy its layout, colours, fonts or graphics");
    });

    it("a text source is lettering: no placeholder, and a Lettering line in the style's type", () => {
      const { prompt, notes } = composePrompt({ ...base, actors: [at(0.5, 0.5, "text")] });
      expect(prompt).toMatch(/^An image of a typography composition,/);
      expect(notes.join(" ")).not.toMatch(/Add a subject/);
      expect(prompt).toMatch(/Lettering: set the words from image 1 exactly as they appear in it, in .+; spell them exactly and add no other words\./);
    });

    it("a comment on an image sets its role when none is chosen", () => {
      const logo = at(0.2, 0.2, undefined, 1);
      const info = at(0.8, 0.8, undefined, 2);
      const p = composePrompt({
        ...base,
        actors: [man, logo, info],
        comments: [
          { id: "a", x: 0.2, y: 0.2, text: "this is company logo. do not alter it" },
          { id: "b", x: 0.8, y: 0.8, text: "keep the text information" },
        ],
      }).prompt;
      expect(p).toMatch(/Image 1: a logo or symbol [^.]*\. Reproduce it exactly/);
      expect(p).toMatch(/Image 2: a source of text\./);
      // A role picked by hand wins over the comment.
      const chosen = composePrompt({ ...base, actors: [man, at(0.2, 0.2, "look", 1)], comments: [{ id: "a", x: 0.2, y: 0.2, text: "our logo" }] }).prompt;
      expect(chosen).toContain("Image 1: use only its look");
    });
  });

  describe("which image tool to use", () => {
    it("points exact-text, logo or own-palette jobs to the tool that followed briefs best", () => {
      const tip = (s: BuilderState) => composePrompt(s).notes.find((n) => /followed briefs/.test(n));
      expect(tip(state({ text: "OPEN LATE" }))).toMatch(/Nano Banana 2/);
      expect(tip(state({ paletteMode: "custom", custom: ["#0B0B0B", "#A6E22E", "#FFFFFF", "#333333"] }))).toMatch(/Nano Banana 2/);
      // A loose brief with the style's colours has no exact demands to follow.
      expect(tip(state())).toBeUndefined();
      expect(tip(state({ text: "OPEN LATE", output: "video" }))).toBeUndefined();
    });

    it("asks for a proofread whenever the image carries words", () => {
      expect(composePrompt(state({ text: "OPEN LATE" })).notes.join(" ")).toMatch(/Proofread/);
      expect(composePrompt(state()).notes.join(" ")).not.toMatch(/Proofread/);
    });
  });

  describe("custom colours on a style with its own colours", () => {
    const custom = state({ style: "blueprint", paletteMode: "custom", count: 3, custom: ["#0B0B0B", "#A6E22E", "#FFFFFF", "#333333"] });

    it("writes the chosen colours straight into the style's own lines", () => {
      const { prompt } = composePrompt(custom);
      expect(prompt).toContain("in the Blueprint style.");
      expect(prompt).toMatch(/Colour palette: black \(#0B0B0B\) as the background/);
      expect(prompt).toContain("Style: fine yellow-green technical linework on black, orthographic views");
      // No instructions about the swap for a writer to copy into the image prompt.
      expect(prompt).not.toMatch(/Colour translation|its own colours|matching palette colour/);
      // The style's own hues appear only in the Avoid line, so the generator's habit of blue blueprints is named.
      const [body, avoid] = prompt.split("\nAvoid: ");
      expect(body).not.toMatch(/Prussian|chalk white|faded blue|deep blue/i);
      expect(avoid).toMatch(/Prussian blue/);
    });

    it("leaves the style's own colours untouched", () => {
      const own = composePrompt(state({ style: "blueprint" })).prompt;
      expect(own).toContain("fine white technical linework on Prussian blue");
      expect(own.split("\nAvoid: ")[1]).not.toMatch(/Prussian/);
    });
  });

  it("maps old framing links to the new camera settings", () => {
    const { state: s, issues } = decodeState(new URLSearchParams("s=swiss&cm=low-angle"));
    expect(issues).toEqual([]);
    expect(s.angle).toBe("low");
    expect(s.composition).toBe("style");
    expect(decodeState(new URLSearchParams("s=swiss&cm=close-up")).state.shot).toBe("close-up");
  });

  it("describes the 3D scene through the shot camera, nearest subject first", () => {
    const knight = { ...newActor("person", "knight", []), position: [-0.6, 0, 1] as Vec3, rotation: [0, 0, 0] as Vec3 };
    const castle = { ...newActor("castle", "castle", [knight]), position: [8, 0, -30] as Vec3 };
    const { prompt, notes } = composePrompt(state({ subject: "", actors: [castle, knight] }));
    expect(prompt).toContain("An image of a knight and a castle, in the Steampunk style.");
    expect(prompt).toMatch(/Layout: a knight, [^;]*facing the camera \(the main subject\); a castle, [^;]*right/);
    expect(notes.join(" ")).not.toMatch(/placeholder/);
    expect(composePrompt(state({ subject: "a raven", actors: [castle, knight] })).prompt).toContain("An image of a knight, a castle and a raven,");
  });

  it("theme prompts apply the style to the user's own work without a placeholder", () => {
    const gothic = getStyle("gothic")!;
    const image = themePrompt(gothic, "image");
    expect(image).toMatch(/^Restyle the provided image in the Gothic style\./);
    expect(image).not.toContain("[describe your subject]");
    expect(image).toMatch(/Preserve: .*original composition/);
    const video = themePrompt(gothic, "video");
    expect(video).toContain("Restyle the provided video");
    expect(video).toContain("keep the source's motion and timing");
  });

  it("restyle: preserving colours replaces the palette section", () => {
    const r = composePrompt(state({ task: "restyle", preserve: ["colours"], paletteMode: "curated", palette: "acid-night" }));
    expect(r.prompt).not.toContain("#C4FF2E");
    expect(r.prompt).toContain("keep the original colours");
    expect(r.notes.join(" ")).toMatch(/palette is not used/);
  });

  it("restyle video with preserved timing omits camera and subject motion", () => {
    const { prompt } = composePrompt(state({ task: "restyle", output: "video", preserve: ["timing"] }));
    expect(prompt).not.toContain("Camera:");
    expect(prompt).toContain("keep the source's motion and timing");
  });

  it("ignores the video-only 'timing' preservation for images", () => {
    const { prompt } = composePrompt(state({ task: "restyle", output: "image", preserve: ["timing"] }));
    expect(prompt).not.toContain("motion, timing");
  });

  it("adds lettering guidance only when text is likely", () => {
    expect(composePrompt(state({ subject: "a quiet harbour" })).prompt).not.toContain("Lettering:");
    expect(composePrompt(state({ subject: "a concert poster for a jazz night" })).prompt).toContain("Lettering:");
  });

  it("sets the exact text the user typed", () => {
    const { prompt } = composePrompt(state({ subject: "a quiet harbour", text: "  Harbour   Lights " }));
    expect(prompt).toMatch(/Lettering: set exactly this text: "Harbour Lights" in .+; spell it exactly as written and add no other words\./);
    expect(prompt).not.toContain("if text appears");
    expect(prompt.match(/Lettering:/g)).toHaveLength(1);
  });

  it("letters text placed on the sketch without making it the subject", () => {
    const table = newActor("table", "a table", []);
    const sign = { ...newActor("text", "OPEN LATE", [table]), position: [0, 1.5, 0] as Vec3 };
    const { prompt } = composePrompt(state({ subject: "", text: "EST. 1920", actors: [table, sign] }));
    expect(prompt).toContain("An image of a table, in the Steampunk style.");
    expect(prompt).toContain('Text element 1: "OPEN LATE"');
    expect(prompt).toMatch(/Lettering: set exactly these texts: "OPEN LATE" and "EST\. 1920" in /);
  });

  it("changes the source lettering to the typed text when restyling", () => {
    const r = composePrompt(state({ task: "restyle", preserve: ["identity", "text"], text: "SALE" }));
    expect(r.prompt).toContain('Lettering: change the lettering to read exactly "SALE"');
    expect(r.prompt).not.toContain("keep existing lettering");
    expect(r.prompt).not.toMatch(/Preserve: .*existing text/);
    expect(r.notes.join(" ")).toMatch(/text you typed/);
  });

  it("never writes \"Style style\"", () => {
    for (const slug of ["swiss", "victorian-style", "clay-style"]) {
      for (const task of ["create", "restyle"] as const) {
        expect(composePrompt(state({ style: slug, task })).prompt).not.toMatch(/style style/i);
      }
    }
    expect(composePrompt(state({ style: "swiss" })).prompt).toContain("in the Swiss / International Typographic Style.");
  });

  it("does not repeat the style lighting when a cue already states it", () => {
    const { prompt } = composePrompt(state({ intensity: "strong" }));
    expect(prompt.match(/gaslight/g)).toHaveLength(1);
    // A user-chosen lighting is always stated.
    expect(composePrompt(state({ intensity: "strong", lighting: "overcast" })).prompt).toContain("Lighting: flat, even overcast light.");
  });

  it("produces a prompt for every style without repeated lines", () => {
    for (const slug of ["swiss", "vaporwave", "gen-x-soft-club", "cyberminimalism", "naive"]) {
      const { prompt } = composePrompt(state({ style: slug, intensity: "strong", output: "video" }));
      const lines = prompt.split("\n");
      expect(new Set(lines).size).toBe(lines.length);
    }
  });

  it("does not interpret markup in the subject", () => {
    const { prompt } = composePrompt(state({ subject: "<img src=x onerror=alert(1)> cat" }));
    // Text is kept verbatim (React escapes it on render); control chars are stripped.
    expect(prompt).toContain("<img src=x onerror=alert(1)> cat");
  });
});

describe("builder URL state", () => {
  it("round-trips a full configuration", () => {
    const s = state({
      style: "vaporwave",
      output: "video",
      task: "restyle",
      subject: "a café at night — with “quotes” & symbols",
      text: "OPEN “LATE” & ネオン",
      intensity: "strong",
      paletteMode: "custom",
      count: 4,
      custom: ["#112233", "#AABBCC", "#FF00FF", "#00FF00"],
      composition: "thirds",
      shot: "medium",
      angle: "low",
      lens: "35",
      genre: "thriller",
      era: "1970s",
      aspect: "9:16",
      view: "2d",
      orbit: { yaw: 45.5, tilt: -10, panX: 1.25, panY: 0.5 },
      lighting: "night",
      preserve: ["identity", "timing"],
      duration: 15,
      camera: "tracking",
      movement: "dynamic",
    });
    const { state: back, issues } = decodeState(new URLSearchParams(encodeState(s).toString()));
    expect(issues).toEqual([]);
    expect(back).toEqual(s);
  });

  it("round-trips a curated palette", () => {
    const s = state({ paletteMode: "curated", palette: "vapor-mall", count: 4 });
    const { state: back } = decodeState(new URLSearchParams(encodeState(s).toString()));
    expect(back.paletteMode).toBe("curated");
    expect(back.palette).toBe("vapor-mall");
    expect(back.count).toBe(4);
  });

  it("a palette link sets curated mode and its size", () => {
    const { state: s } = decodeState(new URLSearchParams("p=ink-and-signal"));
    expect(s.paletteMode).toBe("curated");
    expect(s.count).toBe(2);
  });

  it("reports and recovers from invalid values", () => {
    const { state: s, issues } = decodeState(
      new URLSearchParams("s=nope&o=gif&n=7&c=zzz-123&cm=weird&k=identity-bogus&p=missing"),
    );
    expect(s.style).toBe(defaultState().style);
    expect(s.output).toBe("image");
    expect(s.count).toBe(3);
    expect(s.paletteMode).toBe("style");
    expect(s.composition).toBe("style");
    expect(s.preserve).toEqual(["identity"]);
    expect(issues.length).toBeGreaterThanOrEqual(6);
  });

  it("caps and cleans the subject", () => {
    const { state: s } = decodeState(new URLSearchParams({ q: `  a\u0000b   c ${"x".repeat(1000)}` }));
    expect(s.subject.startsWith("a b c")).toBe(true);
    expect(s.subject.length).toBeLessThanOrEqual(400);
  });
});
