import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { StyleCard } from "../components/cards";
import { colourLabels, densityLabels, formLabels, kindDescriptions, kindLabels } from "../content/facets";
import { styles } from "../content/styles";
import type { ColourFacet, Density, FormFacet, StyleKind } from "../content/types";
import { emptyStyleQuery, filterStyles, type StyleQuery, type StyleSort } from "../lib/catalogue";
import { useMeta } from "../lib/useMeta";

const KINDS = Object.keys(kindLabels) as StyleKind[];
const COLOURS = Object.keys(colourLabels) as ColourFacet[];
const FORMS = Object.keys(formLabels) as FormFacet[];
const DENSITIES = Object.keys(densityLabels) as Density[];
const SORTS: { id: StyleSort; label: string }[] = [
  { id: "featured", label: "Featured first" },
  { id: "az", label: "A → Z" },
  { id: "za", label: "Z → A" },
];

function listParam<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[]): T[] {
  return (params.get(key) ?? "")
    .split(",")
    .filter((v): v is T => (allowed as readonly string[]).includes(v));
}

export function readQuery(params: URLSearchParams): StyleQuery {
  const sort = params.get("sort");
  const density = params.get("density");
  return {
    q: (params.get("q") ?? "").slice(0, 80),
    kinds: listParam(params, "kind", KINDS),
    colours: listParam(params, "colour", COLOURS),
    forms: listParam(params, "form", FORMS),
    density: DENSITIES.includes(density as Density) ? (density as Density) : null,
    sort: SORTS.some((s) => s.id === sort) ? (sort as StyleSort) : "featured",
  };
}

function ChipGroup<T extends string>({
  legend,
  options,
  labels,
  selected,
  onToggle,
  titles,
}: {
  legend: string;
  options: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onToggle: (value: T) => void;
  titles?: Record<T, string>;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="meta mb-2 text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button key={o} type="button" className="chip" aria-pressed={on} title={titles?.[o]} onClick={() => onToggle(o)}>
              {on && <span aria-hidden>✓</span>}
              {labels[o]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Styles() {
  const [params, setParams] = useSearchParams();
  const query = readQuery(params);
  const results = filterStyles(styles, query);
  const activeFilters = query.kinds.length + query.colours.length + query.forms.length + (query.density ? 1 : 0);
  const narrowed = activeFilters > 0 || query.q.trim() !== "";
  useMeta("Styles", `Search and filter ${styles.length} visual styles by colour, form and density.`);

  const update = (patch: Partial<StyleQuery>) => {
    const next = { ...query, ...patch };
    const p = new URLSearchParams();
    if (next.q) p.set("q", next.q);
    if (next.kinds.length) p.set("kind", next.kinds.join(","));
    if (next.colours.length) p.set("colour", next.colours.join(","));
    if (next.forms.length) p.set("form", next.forms.join(","));
    if (next.density) p.set("density", next.density);
    if (next.sort !== "featured") p.set("sort", next.sort);
    setParams(p, { replace: true, preventScrollReset: true });
  };
  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const clearAll = () => update({ ...emptyStyleQuery, sort: query.sort });

  const showLarge = query.sort === "featured" && !narrowed;

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="text-h1 font-bold lg:col-span-7">Styles</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Movements, period looks, aesthetics, techniques and interface styles. Each is described by what you can see: colour, texture,
          lighting, composition and type.
        </p>
      </header>

      {/* Search and filters sit directly above the results. */}
      <section aria-label="Search and filter styles" className="border-b border-rule py-4 sm:py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search styles</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search by name, alias, description or tag…"
              className="field pl-9"
              autoComplete="off"
            />
            {query.q && (
              <button type="button" onClick={() => update({ q: "" })} className="absolute top-1/2 right-2 -translate-y-1/2 p-1" aria-label="Clear search">
                <X size={16} aria-hidden />
              </button>
            )}
          </label>
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <span className="meta shrink-0 text-muted">Sort</span>
              <select className="field" value={query.sort} onChange={(e) => update({ sort: e.target.value as StyleSort })}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <details className="group mt-3" open={activeFilters > 0 || undefined}>
          <summary className="inline-flex min-h-9 list-none items-center gap-2 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal size={16} aria-hidden />
            Filters{activeFilters > 0 ? ` (${activeFilters} active)` : ""}
            <span className="meta text-muted group-open:hidden">show</span>
            <span className="meta hidden text-muted group-open:inline">hide</span>
          </summary>
          <div className="mt-3 grid gap-5 pb-1 md:grid-cols-2 xl:grid-cols-[1.2fr_1.3fr_1.6fr_0.8fr]">
            <ChipGroup legend="Kind" options={KINDS} labels={kindLabels} titles={kindDescriptions} selected={query.kinds} onToggle={(v) => update({ kinds: toggle(query.kinds, v) })} />
            <ChipGroup legend="Colour character" options={COLOURS} labels={colourLabels} selected={query.colours} onToggle={(v) => update({ colours: toggle(query.colours, v) })} />
            <ChipGroup legend="Form" options={FORMS} labels={formLabels} selected={query.forms} onToggle={(v) => update({ forms: toggle(query.forms, v) })} />
            <ChipGroup
              legend="Density"
              options={DENSITIES}
              labels={densityLabels}
              selected={query.density ? [query.density] : []}
              onToggle={(v) => update({ density: query.density === v ? null : v })}
            />
          </div>
        </details>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <p className="meta" role="status" aria-live="polite">
          {results.length === styles.length ? `${styles.length} styles` : `${results.length} of ${styles.length} styles`}
          {activeFilters > 1 && <span className="text-muted"> · filters combine: any within a group, all across groups</span>}
        </p>
        {narrowed && (
          <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm">
            <X size={14} aria-hidden />
            Clear search and filters
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="border-t border-ink py-16">
          <h2 className="text-h2 font-bold">No styles match.</h2>
          <p className="mt-3 max-w-lg text-muted">
            {query.q ? <>Nothing matches “{query.q}” with these filters. </> : "No style has every selected characteristic. "}
            Remove a filter or try a broader word such as “geometric”, “neon” or “paper”.
          </p>
          <button type="button" className="btn btn-primary mt-6" onClick={clearAll}>
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((s, i) => (
            <li key={s.slug} className={showLarge && i < 2 ? "sm:col-span-2" : ""}>
              <StyleCard style={s} large={showLarge && i < 2} eager={i < 6} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
