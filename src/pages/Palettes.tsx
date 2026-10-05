import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { PaletteCard } from "../components/cards";
import { palettes } from "../content/palettes";
import { getStyle, styles } from "../content/styles";
import type { PaletteSize } from "../content/types";
import { filterPalettes } from "../lib/catalogue";
import { useMeta } from "../lib/useMeta";

const SIZES: (PaletteSize | null)[] = [null, 2, 3, 4];
/** Styles that have palettes made for them, for the style filter. */
const STYLE_OPTIONS = styles.filter((s) => palettes.some((p) => p.suits.includes(s.slug)));

export function Palettes() {
  const [params, setParams] = useSearchParams();
  const rawN = params.get("n");
  const size = rawN === "2" || rawN === "3" || rawN === "4" ? (Number(rawN) as PaletteSize) : null;
  const q = (params.get("q") ?? "").slice(0, 80);
  const style = getStyle(params.get("style"));
  const styleSlug = style?.slug ?? null;
  const results = filterPalettes(palettes, size, q, styleSlug);
  useMeta("Palettes", "Palettes of two, three or four colours that work together, each with roles and proportions.");

  const update = (next: { n?: PaletteSize | null; q?: string; style?: string | null }) => {
    const p = new URLSearchParams();
    const n = next.n === undefined ? size : next.n;
    const qq = next.q === undefined ? q : next.q;
    const st = next.style === undefined ? styleSlug : next.style;
    if (n) p.set("n", String(n));
    if (qq) p.set("q", qq);
    if (st) p.set("style", st);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  const countFor = (n: PaletteSize | null) => filterPalettes(palettes, n, q, styleSlug).length;

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="font-display text-h1 font-semibold lg:col-span-7">Palettes</h1>
        <div className="max-w-xl self-end text-muted lg:col-span-5">
          <p>Small sets of colours that already work together. Each colour has a role and a share, so you know which one leads and which one only accents.</p>
        </div>
      </header>

      <aside className="mt-6 grid gap-4 border border-rule-strong p-4 text-[0.9375rem] sm:grid-cols-2 sm:p-5" aria-label="How to read these palettes">
        <p>
          <strong className="font-semibold">Strict limited colour.</strong> The compositions on this page use only the palette’s colours, so you
          see exactly how they sit together.
        </p>
        <p>
          <strong className="font-semibold">Dominant colours.</strong> A photo or generated image “in” a palette will still contain many other
          shades. The palette describes what dominates, not every pixel. Hex values are colour intent, not a guarantee.
        </p>
      </aside>

      <section aria-label="Filter palettes" className="flex flex-col gap-3 border-b border-rule py-5 sm:flex-row sm:flex-wrap sm:items-center">
        <fieldset>
          <legend className="sr-only">Number of colours</legend>
          <div className="seg">
            {SIZES.map((n) => (
              <label key={n ?? "all"}>
                <input type="radio" name="size" checked={size === n} onChange={() => update({ n })} />
                {size === n && <span aria-hidden>✓</span>}
                {n ? `${n} colours` : "All"}
                <span className="meta opacity-70">{countFor(n)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="w-full sm:ml-auto sm:max-w-56">
          <span className="sr-only">Style</span>
          <select className="field" name="palette-style" value={styleSlug ?? ""} onChange={(e) => update({ style: e.target.value || null })}>
            <option value="">All styles</option>
            {STYLE_OPTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search palettes</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="field pl-9" placeholder="Name, mood, colour or hex…" autoComplete="off" name="palette-search" value={q} onChange={(e) => update({ q: e.target.value })} />
          {q && (
            <button type="button" onClick={() => update({ q: "" })} className="absolute top-1/2 right-2 -translate-y-1/2 p-1" aria-label="Clear search">
              <X size={16} aria-hidden />
            </button>
          )}
        </label>
      </section>

      <p className="meta py-4" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "palette" : "palettes"}
        {style ? ` for ${style.name}` : ""}
        {size ? ` with exactly ${size} colours` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      {results.length === 0 ? (
        <div className="border-t border-ink py-16">
          <h2 className="font-display text-h2 font-semibold">No palettes match.</h2>
          <p className="mt-3 text-muted">Try another colour name or hex, or show all sizes and styles.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => update({ n: null, q: "", style: null })}>
            Show all palettes
          </button>
        </div>
      ) : (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => (
            <li key={p.slug}>
              <PaletteCard palette={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
