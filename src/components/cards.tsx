import { Link } from "react-router";
import { PaletteArt } from "../art/PaletteArt";
import { StyleArt } from "../art/StyleArt";
import { kindLabels } from "../content/facets";
import type { PaletteRecord, StyleRecord } from "../content/types";
import { CopyButton, SaveButton } from "./actions";
import { SwatchStrip } from "./Swatches";

export function StyleCard({ style, large = false, eager = false }: { style: StyleRecord; large?: boolean; eager?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col border-t border-ink pt-3">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="meta text-muted">{kindLabels[style.kind]}</span>
        <SaveButton kind="styles" slug={style.slug} label={style.name} size="sm" className="relative z-10" />
      </div>
      <Link to={`/styles/${style.slug}`} className="block" aria-describedby={`sum-${style.slug}`}>
        <StyleArt style={style} zoom eager={eager} aspect={large ? "aspect-[4/5] sm:aspect-[3/2]" : "aspect-[4/5]"} />
        <SwatchStrip colours={style.swatches.map((s) => s.hex)} label={`${style.name} colours: ${style.swatches.map((s) => s.name).join(", ")}`} />
        <h3 className={`mt-3 font-semibold tracking-[-0.02em] group-hover:underline group-focus-visible:underline decoration-2 underline-offset-4 ${large ? "text-3xl sm:text-4xl" : "text-xl"}`}>
          {style.name}
        </h3>
      </Link>
      <p id={`sum-${style.slug}`} className={`mt-1.5 text-muted ${large ? "max-w-xl text-base" : "text-[0.9375rem] leading-snug"}`}>
        {style.summary}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1" aria-label="Tags">
        {style.tags.slice(0, large ? 4 : 3).map((t) => (
          <li key={t} className="meta text-muted">
            #{t.replace(/\s+/g, "-")}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function PaletteCard({ palette }: { palette: PaletteRecord }) {
  const hexes = palette.colours.map((c) => c.hex);
  return (
    <article className="group flex h-full flex-col border-t border-ink pt-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="meta text-muted">{palette.colours.length} colours</span>
        <div className="flex gap-1.5">
          <CopyButton text={hexes.join(", ")} what={`${palette.name} hex codes`} size="sm">
            Copy<span className="sr-only"> {palette.name} hex codes</span>
          </CopyButton>
          <SaveButton kind="palettes" slug={palette.slug} label={palette.name} size="sm" />
        </div>
      </div>
      <Link to={`/palettes/${palette.slug}`} className="block">
        <div className="overflow-hidden">
          <PaletteArt colours={palette.colours} composition={palette.composition} name={palette.name} className="art-zoom aspect-[4/3] h-auto w-full" />
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] decoration-2 underline-offset-4 group-hover:underline">{palette.name}</h3>
      </Link>
      <p className="mt-1 text-[0.9375rem] text-muted">{palette.mood}</p>
      <ul className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${palette.colours.length}, minmax(0, 1fr))` }}>
        {palette.colours.map((c) => (
          <li key={c.hex}>
            <span className="block h-7 border border-swatch-edge" style={{ background: c.hex }} aria-hidden />
            <span className="meta mt-1 block truncate">{c.hex}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
