import { Pencil, Wand2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { PaletteArt } from "../art/PaletteArt";
import { StyleArt } from "../art/StyleArt";
import { CopyButton, SaveButton } from "../components/actions";
import { StyleCard } from "../components/cards";
import { Recovery } from "../components/Recovery";
import { HexSwatch } from "../components/Swatches";
import { getPalette } from "../content/palettes";
import type { PaletteRecord } from "../content/types";
import { stylesForPalette, suggestPalettes } from "../lib/catalogue";
import { inkOn } from "../lib/color";
import { useMeta } from "../lib/useMeta";

const ROLE_HELP: Record<string, string> = {
  background: "Largest area: ground, sky, walls, negative space.",
  primary: "The main subject or the most prominent shapes.",
  secondary: "Supporting shapes, mid-ground, shadows.",
  accent: "Small, high-attention details. Use sparingly.",
};

export function PaletteDetail() {
  const { slug = "" } = useParams();
  const palette = getPalette(slug);
  if (!palette) {
    return (
      <Recovery
        title="That palette isn’t in the library."
        message={<>There’s no palette at “/palettes/{slug}”. Check the link, or pick one of these.</>}
        suggestionsLabel="Palettes to try"
        suggestions={suggestPalettes(slug).map((p) => ({ to: `/palettes/${p.slug}`, label: p.name }))}
        actions={[{ to: "/palettes", label: "Browse all palettes" }]}
      />
    );
  }
  return <PaletteView key={palette.slug} palette={palette} />;
}

function PaletteView({ palette }: { palette: PaletteRecord }) {
  useMeta(`${palette.name} palette`, `${palette.mood}. ${palette.colours.map((c) => c.hex).join(", ")}. ${palette.description}`);
  const hexes = palette.colours.map((c) => c.hex);
  const suits = stylesForPalette(palette);
  const customHref = `/builder?pm=custom&c=${hexes.map((h) => h.slice(1)).join("-")}${suits[0] ? `&s=${suits[0].slug}` : ""}`;

  return (
    <article>
      <div className="wrap pt-6">
        <nav aria-label="Breadcrumb" className="meta text-muted">
          <ol className="flex gap-1.5">
            <li>
              <Link to="/palettes" className="underline underline-offset-2 hover:text-ink">
                Palettes
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {palette.name}
            </li>
          </ol>
        </nav>
      </div>

      <header className="wrap grid gap-8 pt-8 pb-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="meta text-muted">{palette.colours.length}-colour palette</p>
          <h1 className="mt-3 text-h1 font-bold">{palette.name}</h1>
          <p className="mt-3 text-xl">{palette.mood}</p>
          <p className="mt-5 max-w-lg text-muted">{palette.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to={`/builder?p=${palette.slug}${suits[0] ? `&s=${suits[0].slug}` : ""}`} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="btn btn-primary">
              <Wand2 size={16} aria-hidden />
              Use in builder
            </Link>
            <Link to={customHref} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="btn btn-ghost">
              <Pencil size={16} aria-hidden />
              Edit colours
            </Link>
            <CopyButton text={hexes.join(", ")} what="all hex codes">
              Copy all
            </CopyButton>
            <SaveButton kind="palettes" slug={palette.slug} label={palette.name} />
          </div>
          <p className="meta mt-3 max-w-md text-muted">“Edit colours” opens a custom copy in the builder. The curated palette stays unchanged.</p>
        </div>
        <div className="lg:col-span-7">
          <PaletteArt colours={palette.colours} composition={palette.composition} name={palette.name} className="aspect-[4/3] h-auto w-full" />
          <p className="meta mt-2 text-muted">Strict {palette.colours.length}-colour composition. Only these hex values are used.</p>
        </div>
      </header>

      <section className="wrap border-t border-ink py-12" aria-labelledby="roles-title">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="roles-title" className="text-h2 font-bold">
              Roles and proportions
            </h2>
            <p className="mt-3 max-w-sm text-muted">
              Suggested shares of the image, totalling 100%. Select a colour to copy its hex.
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="flex h-16 border border-swatch-edge" role="img" aria-label={`Proportions: ${palette.colours.map((c) => `${c.name} ${c.share}%`).join(", ")}`}>
              {palette.colours.map((c) => (
                <div key={c.hex} className="flex items-end p-1.5" style={{ width: `${c.share}%`, background: c.hex, color: inkOn(c.hex) }}>
                  <span className="meta">{c.share}%</span>
                </div>
              ))}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {palette.colours.map((c) => (
                <li key={c.hex} className="grid grid-cols-[7rem_1fr] gap-3">
                  <HexSwatch hex={c.hex} name={c.name} role={c.role} share={c.share} tall />
                  <div className="self-end pb-1">
                    <p className="font-semibold capitalize">{c.role}</p>
                    <p className="text-sm text-muted">{ROLE_HELP[c.role]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="wrap border-t border-ink py-12" aria-labelledby="dominant-title">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="dominant-title" className="text-h2 font-bold">
              Dominant vs. strict
            </h2>
          </div>
          <div className="grid gap-6 text-[1.0625rem] sm:grid-cols-2 lg:col-span-8">
            <p>
              <strong className="font-semibold">Strict limited-colour work</strong> (poster, flat vector, screen print) can use only these
              colours. Say “use only these colours” in your prompt.
            </p>
            <p>
              <strong className="font-semibold">Photographic or painterly work</strong> will always include shading, highlights and in-between
              tones. There, the palette sets which hues dominate. Generators treat hex codes as guidance and rarely match them exactly.
            </p>
          </div>
        </div>
      </section>

      {suits.length > 0 && (
        <section className="wrap border-t border-ink py-12" aria-labelledby="suits-title">
          <h2 id="suits-title" className="text-h2 font-bold">
            Compatible aesthetics
          </h2>
          <p className="mt-2 max-w-xl text-muted">Studies recoloured with this palette, then the styles it was chosen for.</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {suits.slice(0, 4).map((s) => (
              <li key={s.slug}>
                <Link to={`/builder?s=${s.slug}&p=${palette.slug}`} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="group block">
                  <StyleArt style={s} colours={hexes} zoom />
                  <span className="mt-1.5 block text-sm group-hover:underline">
                    {s.name} <span className="text-muted">in the builder</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {suits.map((s) => (
              <li key={s.slug}>
                <StyleCard style={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
