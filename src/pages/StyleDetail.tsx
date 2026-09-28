import { ArrowRight, Info, Wand2 } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { PaletteArt } from "../art/PaletteArt";
import { ReferenceFigure } from "../art/ReferenceFigure";
import { StyleArt } from "../art/StyleArt";
import { CopyButton, SaveButton } from "../components/actions";
import { StyleCard } from "../components/cards";
import { Recovery } from "../components/Recovery";
import { HexSwatch } from "../components/Swatches";
import { Tabs } from "../components/Tabs";
import { coverPrompts } from "../content/coverPrompts";
import { covers, similarCovers } from "../content/covers";
import { kindDescriptions, kindLabels } from "../content/facets";
import { getReference } from "../content/references";
import { getStyle } from "../content/styles";
import type { ReferenceImage, StyleRecord } from "../content/types";
import { palettesForStyle, relatedStyles, suggestStyles } from "../lib/catalogue";
import { restyleTemplate, stylePreviewPrompt } from "../lib/prompt/compose";
import { useMeta } from "../lib/useMeta";

export function StyleDetail() {
  const { slug = "" } = useParams();
  const style = getStyle(slug);
  if (!style) {
    const suggestions = suggestStyles(slug);
    return (
      <Recovery
        title="That style isn’t in the library."
        message={<>There’s no style at “/styles/{slug}”. It may have been renamed, or the link has a typo.</>}
        suggestions={suggestions.map((s) => ({ to: `/styles/${s.slug}`, label: s.name }))}
        actions={[
          { to: `/styles?q=${encodeURIComponent(slug.replace(/-/g, " "))}`, label: "Search styles" },
          { to: "/styles", label: "Browse all styles" },
        ]}
      />
    );
  }
  return <StyleView key={style.slug} style={style} />;
}

const LOOK_ROWS: [keyof StyleRecord["look"], string][] = [
  ["colour", "Colour"],
  ["texture", "Texture"],
  ["materials", "Materials"],
  ["lighting", "Lighting"],
  ["composition", "Composition"],
  ["typography", "Typography"],
];

function PromptBlock({ text, what, builderHref, children }: { text: string; what: string; builderHref?: string; children?: React.ReactNode }) {
  return (
    <div>
      <pre className="max-h-[28rem] overflow-auto border border-rule-strong bg-field p-4 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={text} what={what} variant="primary">
          Copy prompt
        </CopyButton>
        {builderHref && (
          <Link to={builderHref} className="btn btn-ghost">
            <Wand2 size={16} aria-hidden />
            Customise in builder
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

/** The main cover (or SVG study), with any similar covers as thumbnails that swap into the main spot. */
function HeaderArt({ style }: { style: StyleRecord }) {
  const main = covers[style.slug];
  const all = main ? [main, ...similarCovers(style.slug)] : [];
  const [shown, setShown] = useState(0);
  const current = all[shown];

  return (
    <>
      {shown > 0 && current ? (
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: style.swatches[0].hex }}>
          <img
            src={current.src}
            width={current.width}
            height={current.height}
            alt={`Similar cover image ${shown + 1} of ${all.length} for ${style.name}.`}
            className="h-full w-full object-cover"
          />
          <span className="meta absolute bottom-2 left-2 rounded-[2px] bg-paper/90 px-1.5 py-0.5 text-ink">Similar cover</span>
        </div>
      ) : (
        <StyleArt style={style} eager />
      )}
      {all.length > 1 && (
        <div className="mt-3">
          <p className="meta text-muted">Similar covers</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {all.map((c, i) => (
              <li key={c.src}>
                <button
                  type="button"
                  onClick={() => setShown(i)}
                  aria-pressed={i === shown}
                  aria-label={i === 0 ? "Show main cover" : `Show similar cover ${i + 1}`}
                  className={`block size-16 overflow-hidden border-2 ${i === shown ? "border-ink" : "border-transparent opacity-80 hover:opacity-100"}`}
                >
                  <img src={c.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="meta mt-2 text-muted">
        {main ? "Cover image" : "Original study"} made for this library to show the look’s ingredients. Not a historical artwork.
      </p>
    </>
  );
}

function StyleView({ style }: { style: StyleRecord }) {
  useMeta(style.name, `${style.summary} Visual ingredients, colours and ready-to-copy image and video prompts.`);
  const refs = style.references.map(getReference).filter((r): r is ReferenceImage => Boolean(r));
  const matches = palettesForStyle(style);
  const related = relatedStyles(style);
  const imagePrompt = stylePreviewPrompt(style, "image");
  const videoPrompt = stylePreviewPrompt(style, "video");
  const restyle = restyleTemplate(style);
  const cover = coverPrompts[style.slug];
  const builder = `/builder?s=${style.slug}`;

  return (
    <article>
      <div className="wrap pt-6">
        <nav aria-label="Breadcrumb" className="meta text-muted">
          <ol className="flex gap-1.5">
            <li>
              <Link to="/styles" className="underline underline-offset-2 hover:text-ink">
                Styles
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {style.name}
            </li>
          </ol>
        </nav>
      </div>

      {/* ——— Header ——— */}
      <header className="wrap grid gap-8 pt-8 pb-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7 lg:pr-6">
          <p className="meta text-muted" title={kindDescriptions[style.kind]}>
            {kindLabels[style.kind]}: {kindDescriptions[style.kind].replace(/\.$/, "").toLowerCase()}
          </p>
          <h1 className="mt-3 text-h1 font-bold [overflow-wrap:anywhere]">{style.name}</h1>
          {style.aliases.length > 0 && (
            <p className="mt-4 text-[0.9375rem] text-muted">
              Also called: {style.aliases.filter((a) => a !== style.name).join(", ")}
            </p>
          )}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">{style.about}</p>
          {style.note && (
            <p className="mt-5 flex max-w-2xl gap-2 border-l-2 border-ink pl-3 text-[0.9375rem] text-muted">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              {style.note}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to={builder} className="btn btn-primary">
              <Wand2 size={16} aria-hidden />
              Use in builder
            </Link>
            <CopyButton text={imagePrompt} what={`${style.name} image prompt`}>
              Copy image prompt
            </CopyButton>
            <SaveButton kind="styles" slug={style.slug} label={style.name} />
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-1" aria-label="Tags">
            {style.tags.map((t) => (
              <li key={t}>
                <Link to={`/styles?q=${encodeURIComponent(t)}`} className="meta text-muted underline-offset-2 hover:text-ink hover:underline">
                  #{t.replace(/\s+/g, "-")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5">
          <HeaderArt key={style.slug} style={style} />
        </div>
      </header>

      {/* ——— References ——— */}
      <section className="wrap border-t border-ink py-12" aria-labelledby="refs-title">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="refs-title" className="text-h2 font-bold">
              References
            </h2>
            <p className="mt-3 max-w-sm text-muted">
              {refs.length
                ? "Openly licensed works that show part of this look. Each is credited with its source and licence."
                : "No openly licensed photographic reference has been added for this style yet. The study above shows its ingredients."}
            </p>
          </div>
          {refs.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
              {refs.map((r) => (
                <ReferenceFigure key={r.id} image={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ——— Ingredients ——— */}
      <section className="wrap border-t border-ink py-12" aria-labelledby="ingredients-title">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="ingredients-title" className="text-h2 font-bold">
              Visual ingredients
            </h2>
            <p className="mt-3 max-w-sm text-muted">What to look for, and what the prompts below describe.</p>
            <div className="mt-6 grid grid-cols-2 gap-1.5">
              {style.swatches.map((s) => (
                <HexSwatch key={s.hex} hex={s.hex} name={s.name} />
              ))}
            </div>
            <p className="meta mt-2 text-muted">Defining colours. Select one to copy its hex.</p>
          </div>
          <dl className="grid gap-x-8 sm:grid-cols-2 lg:col-span-8">
            {LOOK_ROWS.map(([key, label]) => (
              <div key={key} className="border-t border-rule py-4">
                <dt className="meta text-muted">{label}</dt>
                <dd className="mt-1.5 text-[1.0625rem] leading-snug first-letter:uppercase">{style.look[key]}</dd>
              </div>
            ))}
            <div className="border-t border-rule py-4 sm:col-span-2">
              <dt className="meta text-muted">Often pulls away from the look</dt>
              <dd className="mt-1.5 text-[1.0625rem] leading-snug first-letter:uppercase">{style.prompt.avoid.join(", ")}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ——— Prompts ——— */}
      <section className="wrap border-t border-ink py-12" aria-labelledby="prompts-title">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="prompts-title" className="text-h2 font-bold">
              Prompts
            </h2>
            <p className="mt-3 max-w-sm text-muted">
              Starting points built from the ingredients above. Replace the bracketed subject, or open the builder to set subject, palette,
              framing and motion.
            </p>
          </div>
          <div className="min-w-0 lg:col-span-8">
            <Tabs
              label="Prompt type"
              tabs={[
                { id: "image", label: "Image", content: <PromptBlock text={imagePrompt} what="image prompt" builderHref={builder} /> },
                { id: "video", label: "Video", content: <PromptBlock text={videoPrompt} what="video prompt" builderHref={`${builder}&o=video`} /> },
                {
                  id: "restyle",
                  label: "Restyle an existing image",
                  content: <PromptBlock text={restyle} what="restyle prompt" builderHref={`${builder}&t=restyle`} />,
                },
                ...(cover
                  ? [
                      {
                        id: "cover",
                        label: "Cover image",
                        content: (
                          <PromptBlock text={cover.prompt} what="cover image prompt">
                            <p className="meta mt-4 text-muted">
                              The prompt for this style’s cover: {cover.artwork}, {cover.format}.
                            </p>
                            {cover.ifItMisses && (
                              <p className="mt-2 max-w-2xl text-[0.9375rem] text-muted">
                                <span className="font-semibold text-ink">If it misses:</span> {cover.ifItMisses}
                              </p>
                            )}
                          </PromptBlock>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
      </section>

      {/* ——— Palettes ——— */}
      <section className="wrap border-t border-ink py-12" aria-labelledby="pal-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="pal-title" className="text-h2 font-bold">
            Compatible palettes
          </h2>
          <Link to="/palettes" className="inline-flex items-center gap-1.5 text-[0.9375rem] hover:underline">
            All palettes <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {matches.map(({ palette, reason }) => (
            <li key={palette.slug} className="border-t border-rule pt-3">
              <Link to={`/palettes/${palette.slug}`} className="group block">
                <PaletteArt colours={palette.colours} composition={palette.composition} name={palette.name} className="aspect-[4/3] h-auto w-full" />
                <p className="mt-2 font-semibold group-hover:underline">{palette.name}</p>
              </Link>
              <p className="meta text-muted">
                {palette.colours.length} colours · {reason === "curated" ? "curated pairing" : "close colour match"}
              </p>
              <Link to={`/builder?s=${style.slug}&p=${palette.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm underline underline-offset-2">
                Use with {style.name.split(" / ")[0]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Related ——— */}
      {related.length > 0 && (
        <section className="wrap border-t border-ink py-12" aria-labelledby="related-title">
          <h2 id="related-title" className="text-h2 font-bold">
            Related styles
          </h2>
          <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <StyleCard style={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
