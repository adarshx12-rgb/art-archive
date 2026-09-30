import { ArrowRight, Search, X } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { TemplateStage } from "../components/TemplateStage";
import { styles } from "../content/styles";
import { formatInfo, isTemplateFormat, TEMPLATE_FORMATS, templatesFor } from "../content/templates";
import type { StyleRecord, StyleTemplate, TemplateFormat } from "../content/types";
import { useMeta } from "../lib/useMeta";

const PLURAL: Record<TemplateFormat, string> = { magazine: "Magazine covers", poster: "Posters", flyer: "Flyers", thumbnail: "Thumbnails" };

/** One template as a gallery tile: the piece on its stage, then the style, format and layout name. */
function Tile({ style, template, showStyle }: { style: StyleRecord; template: StyleTemplate; showStyle: boolean }) {
  const f = formatInfo(template.format);
  return (
    <Link to={`/styles/${style.slug}?template=${template.format}`} className="group block min-w-0">
      <TemplateStage
        template={template}
        style={style}
        ratio={1}
        lazy
        label={`${style.name} ${f.label.toLowerCase()}: ${template.name}`}
        className="rounded-lg outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-hover:outline-rule-strong group-focus-visible:outline-ink"
      />
      <span className="mt-3 flex items-baseline justify-between gap-2">
        <span className="truncate text-[0.9375rem] group-hover:underline">{showStyle ? style.name : f.label}</span>
        <span className="meta shrink-0 text-muted">{showStyle ? f.label : f.aspect}</span>
      </span>
      <span className="meta mt-0.5 block truncate text-muted">{template.name}</span>
    </Link>
  );
}

const matches = (s: StyleRecord, q: string) => {
  const words = q.toLowerCase().trim();
  if (!words) return true;
  return [s.name, ...s.aliases, ...s.tags, s.summary, ...templatesFor(s.slug).map((t) => t.name)].some((x) => x.toLowerCase().includes(words));
};

export function Templates() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("format");
  const format = raw && isTemplateFormat(raw) ? raw : null;
  const q = (params.get("q") ?? "").slice(0, 80);
  const withTemplates = styles.filter((s) => templatesFor(s.slug).length > 0);
  const shown = withTemplates.filter((s) => matches(s, q));
  const total = withTemplates.reduce((n, s) => n + templatesFor(s.slug).length, 0);
  useMeta("Templates", `${total} design templates for magazine covers, posters, flyers and thumbnails, in ${withTemplates.length} visual styles.`);

  const update = (patch: { format?: TemplateFormat | null; q?: string }) => {
    const next = { format, q, ...patch };
    const p = new URLSearchParams();
    if (next.format) p.set("format", next.format);
    if (next.q) p.set("q", next.q);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  const flat = format ? shown.flatMap((s) => templatesFor(s.slug).filter((t) => t.format === format).map((t) => ({ style: s, template: t }))) : [];
  const count = format ? flat.length : shown.reduce((n, s) => n + templatesFor(s.slug).length, 0);

  return (
    <div className="wrap pt-10 pb-20 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="text-h1 font-bold lg:col-span-7">Templates</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Starting layouts for magazine covers, posters, flyers and thumbnails, each designed in the look of its style. Open one to change the
          words, then take it to the builder.
        </p>
      </header>

      <section aria-label="Filter templates" className="flex flex-col gap-3 border-b border-rule py-4 sm:py-5 lg:flex-row lg:items-center">
        <div className="seg flex-wrap" role="radiogroup" aria-label="Format">
          {[null, ...TEMPLATE_FORMATS.map((f) => f.id)].map((id) => (
            <label key={id ?? "all"}>
              <input type="radio" name="format" checked={format === id} onChange={() => update({ format: id })} />
              {format === id && <span aria-hidden>✓</span>}
              {id ? PLURAL[id] : "All formats"}
            </label>
          ))}
        </div>
        <label className="relative lg:ml-auto lg:w-80">
          <span className="sr-only">Search templates by style</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Search by style, e.g. “neon” or “retro”…" className="field pl-9" autoComplete="off" />
          {q && (
            <button type="button" onClick={() => update({ q: "" })} className="absolute top-1/2 right-2 -translate-y-1/2 p-1" aria-label="Clear search">
              <X size={16} aria-hidden />
            </button>
          )}
        </label>
      </section>

      <p className="meta py-4" role="status" aria-live="polite">
        {count} template{count === 1 ? "" : "s"}
        {!format && ` in ${shown.length} style${shown.length === 1 ? "" : "s"}`}
      </p>

      {count === 0 ? (
        <div className="border-t border-ink py-16">
          <h2 className="text-h2 font-bold">No templates match.</h2>
          <p className="mt-3 max-w-lg text-muted">Nothing matches “{q}”. Try a broader word such as “retro”, “neon” or “paper”.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => update({ q: "", format: null })}>
            Show all templates
          </button>
        </div>
      ) : format ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {flat.map(({ style, template }) => (
            <li key={`${style.slug}/${template.format}`}>
              <Tile style={style} template={template} showStyle />
            </li>
          ))}
        </ul>
      ) : (
        // All formats: one row per style, so each style's set reads together.
        <div className="space-y-12">
          {shown.map((s) => (
            <section key={s.slug} aria-labelledby={`t-${s.slug}`} className="border-t border-rule pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`t-${s.slug}`} className="text-xl font-semibold tracking-[-0.01em]">
                  {s.name}
                </h2>
                <Link to={`/styles/${s.slug}#templates`} className="inline-flex items-center gap-1 text-[0.9375rem] underline-offset-4 hover:underline">
                  Open {s.name} <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
                {templatesFor(s.slug).map((t) => (
                  <li key={t.format}>
                    <Tile style={s} template={t} showStyle={false} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
