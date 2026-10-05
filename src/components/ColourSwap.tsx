import { ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { styles } from "../content/styles";
import type { PaletteRecord } from "../content/types";
import { aiSwap, type AiResult, type SwapReply } from "../lib/ai";
import { stylesForPalette } from "../lib/catalogue";
import { inkOn } from "../lib/color";
import { initialSwapStyle, parseHexInput, swapBuilderHref } from "../lib/swap";
import { CopyButton } from "./actions";
import { HexSwatch } from "./Swatches";

/** Swap one colour of a palette; the AI rebuilds the rest for the chosen style. */
export function ColourSwap({ palette }: { palette: PaletteRecord }) {
  const [params] = useSearchParams();
  const last = palette.colours.length - 1;
  const [index, setIndex] = useState(last);
  const [text, setText] = useState<string>(palette.colours[last]!.hex);
  const [style, setStyle] = useState(() => initialSwapStyle(palette, params.get("s")));
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AiResult<SwapReply> | null>(null);

  const hex = parseHexInput(text);
  const suited = stylesForPalette(palette);
  const others = styles.filter((s) => !palette.suits.includes(s.slug));

  const ask = async () => {
    if (!hex || asking) return;
    setAsking(true);
    setResult(await aiSwap({ style, colours: palette.colours.map((c) => ({ hex: c.hex, name: c.name })), index, hex }));
    setAsking(false);
  };

  return (
    <div className="mt-10 border-t border-rule pt-6">
      <h3 className="text-lg font-semibold">Swap a colour</h3>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Pick a colour to replace and choose a new one. AI rebuilds the rest of the palette around it, in the style you choose.
      </p>
      <form
        className="mt-4 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <fieldset>
          <legend className="meta mb-2 text-muted">Colour to replace</legend>
          <div className="flex flex-wrap gap-2">
            {palette.colours.map((c, i) => (
              <label key={c.hex} className={`flex cursor-pointer items-center gap-2 border px-2 py-1.5 text-sm has-[:focus-visible]:outline-2 ${i === index ? "border-ink" : "border-rule hover:border-rule-strong"}`}>
                <input
                  type="radio"
                  name="swap-slot"
                  className="sr-only"
                  checked={i === index}
                  onChange={() => {
                    setIndex(i);
                    setText(c.hex);
                  }}
                />
                <span className="size-5 border border-swatch-edge" style={{ background: c.hex }} aria-hidden />
                <span className="capitalize">{c.role}</span>
                <span className="meta text-muted">{c.hex}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <label htmlFor="swap-hex" className="meta text-muted">
              New colour
            </label>
            <span className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick the new colour"
                value={hex ?? "#000000"}
                onChange={(e) => setText(e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer border border-rule bg-transparent"
              />
              <input
                id="swap-hex"
                className="field w-32 font-mono"
                value={text}
                maxLength={7}
                onChange={(e) => setText(e.target.value)}
                aria-invalid={!hex}
                aria-describedby="swap-hex-help"
                spellCheck={false}
                autoComplete="off"
              />
            </span>
          </div>
          <label className="grid gap-1">
            <span className="meta text-muted">Style</span>
            <select className="field" value={style} onChange={(e) => setStyle(e.target.value)}>
              {suited.length > 0 && (
                <optgroup label="Made for this palette">
                  {suited.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Other styles">
                {others.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={!hex || asking}>
            {asking ? "Thinking…" : "Suggest palettes"}
          </button>
        </div>
        <p id="swap-hex-help" className={`text-sm ${hex ? "text-muted" : "text-alert"}`}>
          {hex ? "You’ll get three palettes that keep this colour." : "Enter a hex code like #1F5FD6."}
        </p>
      </form>

      {result && !result.ok && (
        <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-alert" role="status">
          {result.error}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => void ask()}>
            <RefreshCw size={14} aria-hidden /> Try again
          </button>
        </p>
      )}
      {result?.ok && (
        <ul className="mt-6 grid gap-8 md:grid-cols-3" role="status" aria-label="Suggested palettes">
          {result.data.palettes.map((sp) => {
            const hexes = sp.colours.map((c) => c.hex);
            return (
              <li key={hexes.join()} className="border-t border-ink pt-3">
                <div className="flex h-12 border border-swatch-edge" role="img" aria-label={`${sp.name}: ${sp.colours.map((c) => `${c.name} ${c.hex}`).join(", ")}`}>
                  {sp.colours.map((c, i) => (
                    <div key={i} className="flex items-end p-1" style={{ width: `${palette.colours[i]!.share}%`, background: c.hex, color: inkOn(c.hex) }}>
                      <span className="meta">{palette.colours[i]!.share}%</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 font-semibold">{sp.name}</p>
                <p className="text-sm text-muted">{sp.why}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {sp.colours.map((c, i) => (
                    <HexSwatch key={i} hex={c.hex} name={c.name} role={c.role} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton text={hexes.join(", ")} what={`${sp.name} hex codes`} size="sm">
                    Copy all
                  </CopyButton>
                  <Link to={swapBuilderHref(hexes, style)} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="btn btn-sm btn-ghost">
                    Open in builder <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
