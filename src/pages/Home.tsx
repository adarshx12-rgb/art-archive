import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ReferenceFigure } from "../art/ReferenceFigure";
import { StyleArt } from "../art/StyleArt";
import { PaletteCard, StyleCard } from "../components/cards";
import { site } from "../config/site";
import { featuredPalettes, getPalette } from "../content/palettes";
import { getReference } from "../content/references";
import { featuredStyles, getStyle, styles } from "../content/styles";
import { palettes } from "../content/palettes";
import { useMeta } from "../lib/useMeta";

export function Home() {
  useMeta(null, site.description);
  const collageRef = getReference("schwitters-entrance-ticket")!;
  const mucha = getReference("mucha-job-1896")!;
  const swiss = getStyle("swiss")!;
  const softClub = getStyle("gen-x-soft-club")!;
  const vapor = getStyle("vaporwave")!;
  const chipPalette = getPalette("primary-school")!;

  return (
    <>
      {/* ——— Hero ——— */}
      <section className="wrap grid gap-10 pt-10 pb-16 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-24" aria-labelledby="hero-title">
        <div className="flex flex-col lg:col-span-7 lg:pt-6">
          <h1 id="hero-title" className="enter text-display font-extrabold">
            Find the look.
            <br />
            Make it yours.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted sm:text-xl">{site.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to="/styles" className="btn btn-primary">
              Explore styles
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link to="/palettes" className="btn btn-ghost">
              Explore palettes
            </Link>
          </div>

          <div className="pt-14">
            <p className="meta text-muted">Try a style</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {["bauhaus", "art-deco", "y2k", "cyberminimalism", "psychedelic", "steampunk"].map((slug) => {
                const s = getStyle(slug)!;
                return (
                  <li key={slug}>
                    <Link to={`/styles/${slug}`} className="chip">
                      {s.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="meta mt-5 text-muted">
              A three-colour palette: <Link to={`/palettes/${chipPalette.slug}`} className="underline underline-offset-2">{chipPalette.name}</Link>
            </p>
            <ul className="mt-2 flex gap-1.5" aria-label={`${chipPalette.name} colours`}>
              {chipPalette.colours.map((c) => (
                <li key={c.hex} className="flex items-center gap-2 border border-rule-strong py-1 pr-2.5 pl-1">
                  <span className="h-5 w-5 border border-black/10" style={{ background: c.hex }} aria-hidden />
                  <span className="meta">{c.hex}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Collage: references are credited; studies are labelled as studies. */}
        <div className="grid grid-cols-6 content-start gap-3 sm:gap-4 lg:col-span-5" aria-label="Sample artwork">
          <div className="col-span-3 row-span-2">
            <ReferenceFigure image={collageRef} eager crop="aspect-[900/1085]" compact />
            <p className="meta mt-1 text-ink">Collage Art, reference</p>
          </div>
          <Link to={`/styles/${swiss.slug}`} className="group col-span-3 block">
            <StyleArt style={swiss} eager zoom label={false} />
            <p className="meta mt-1.5">
              {swiss.name.split(" / ")[0]}, <span className="text-muted">illustrative study</span>
            </p>
          </Link>
          <Link to={`/styles/${softClub.slug}`} className="group col-span-3 block">
            <StyleArt style={softClub} eager zoom label={false} aspect="aspect-[4/3]" />
            <p className="meta mt-1.5">
              {softClub.name}, <span className="text-muted">illustrative study</span>
            </p>
          </Link>
          <Link to={`/styles/${vapor.slug}`} className="group col-span-4 block">
            <StyleArt style={vapor} eager zoom label={false} aspect="aspect-[4/3]" />
            <p className="meta mt-1.5">
              {vapor.name}, <span className="text-muted">illustrative study</span>
            </p>
          </Link>
          <div className="col-span-2">
            <ReferenceFigure image={mucha} eager crop="aspect-[3/4]" compact />
            <p className="meta mt-1 text-ink">Art Nouveau, reference</p>
          </div>
        </div>
      </section>

      {/* ——— Featured aesthetics ——— */}
      <section className="wrap pb-20" aria-labelledby="featured-title">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
          <h2 id="featured-title" className="text-h2 font-bold">
            Featured aesthetics
          </h2>
          <Link to="/styles" className="inline-flex items-center gap-1.5 text-[0.9375rem] underline-offset-4 hover:underline">
            Explore styles ({styles.length}) <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {featuredStyles.slice(0, 7).map((s, i) => (
            <div key={s.slug} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
              <StyleCard style={s} large={i === 0} />
            </div>
          ))}
        </div>
      </section>

      {/* ——— Palettes ——— */}
      <section className="border-y border-rule bg-paper-2/60 py-16" aria-labelledby="palette-title">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-4">
            <div>
              <h2 id="palette-title" className="text-h2 font-bold">
                Two, three or four colours
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Each palette comes with roles and proportions, so a prompt can say which colour dominates and which is only an accent.
              </p>
            </div>
            <Link to="/palettes" className="inline-flex items-center gap-1.5 text-[0.9375rem] underline-offset-4 hover:underline">
              Explore palettes ({palettes.length}) <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featuredPalettes.slice(0, 4).map((p) => (
              <PaletteCard key={p.slug} palette={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ——— How it works: an ordered list, since the steps are a real sequence ——— */}
      <section className="wrap py-20" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-h2 font-bold">
          From reference to prompt
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["Pick a look", "Browse styles by colour, form and density. Each page lists the textures, lighting and composition that define it.", "/styles", "Explore styles"],
            ["Choose your colours", "Use the style’s own colours, a curated palette, or your own two to four hex values.", "/palettes", "Explore palettes"],
            ["Describe and copy", "Add your subject, choose image or video, then copy, download or share the finished prompt.", "/builder", "Open the builder"],
          ].map(([title, body, to, cta]) => (
            <li key={title} className="border-t border-ink pt-4">
              <h3 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="mt-2 text-muted">{body}</p>
              <Link to={to!} className="mt-3 inline-flex items-center gap-1.5 text-[0.9375rem] underline underline-offset-4">
                {cta} <ArrowRight size={15} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
