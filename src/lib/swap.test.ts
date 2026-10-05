import { describe, expect, it } from "vitest";
import { getPalette } from "../content/palettes";
import { initialSwapStyle, parseHexInput, swapBuilderHref } from "./swap";

describe("swap helpers", () => {
  it("parses hex input, expanding 3 digits and rejecting junk", () => {
    expect(parseHexInput("#0af")).toBe("#00AAFF");
    expect(parseHexInput("1f5fd6")).toBe("#1F5FD6");
    expect(parseHexInput(" #1F5FD6 ")).toBe("#1F5FD6");
    expect(parseHexInput("blue")).toBeNull();
    expect(parseHexInput("")).toBeNull();
  });

  it("starts on the ?s= style when valid, else the palette's first suited style", () => {
    const p = getPalette("ink-and-signal")!;
    expect(initialSwapStyle(p, "punk")).toBe("punk");
    expect(initialSwapStyle(p, "no-such-style")).toBe("swiss");
    expect(initialSwapStyle(p, null)).toBe("swiss");
  });

  it("links to the builder with custom colours and the style", () => {
    expect(swapBuilderHref(["#FFF4D6", "#1F5FD6"], "pop-art")).toBe("/builder?pm=custom&c=FFF4D6-1F5FD6&s=pop-art");
  });
});
