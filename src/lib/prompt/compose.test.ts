import { describe, expect, it } from "vitest";
import { composePrompt, resolvePalette, themePrompt } from "./compose";
import { decodeState, defaultState, encodeState, type BuilderState } from "./state";
import { getStyle } from "../../content/styles";
import { newActor, type Vec3 } from "../scene/model";

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
    const { prompt } = composePrompt(state({ subject: "a quiet harbour", text: "  Harbour\n  Lights " }));
    expect(prompt).toMatch(/Lettering: set exactly this text: "Harbour Lights" in .+; spell it exactly as written and add no other words\./);
    expect(prompt).not.toContain("if text appears");
    expect(prompt.match(/Lettering:/g)).toHaveLength(1);
  });

  it("letters text placed on the sketch without making it the subject", () => {
    const table = newActor("table", "a table", []);
    const sign = { ...newActor("text", "OPEN LATE", [table]), position: [0, 1.5, 0] as Vec3 };
    const { prompt } = composePrompt(state({ subject: "", text: "EST. 1920", actors: [table, sign] }));
    expect(prompt).toContain("An image of a table, in the Steampunk style.");
    expect(prompt).toMatch(/Layout: .*the text "OPEN LATE"/);
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
