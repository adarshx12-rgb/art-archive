import { Link } from "react-router";
import { ReferenceFigure } from "../art/ReferenceFigure";
import { references } from "../content/references";
import { styles } from "../content/styles";
import { useMeta } from "../lib/useMeta";

export function Credits() {
  useMeta("Image credits", "Sources and licences for reference imagery, and how illustrative studies are made.");
  const withRefs = new Map<string, string[]>();
  for (const s of styles) for (const r of s.references) withRefs.set(r, [...(withRefs.get(r) ?? []), s.name]);
  const missing = styles.filter((s) => s.references.length === 0);

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="text-h1 font-bold lg:col-span-7">Image credits</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Two kinds of artwork appear on this site, and each is labelled so you can tell them apart.
        </p>
      </header>

      <section className="grid gap-6 border-b border-rule py-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Illustrative studies</h2>
          <p className="mt-2 text-muted">
            Original SVG compositions made for this library, one per style. They demonstrate a style’s visual ingredients (colour, shape,
            texture cues) and are never presented as historical works. They can be recoloured live in the builder.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">References</h2>
          <p className="mt-2 text-muted">
            Photographs and scans from Wikimedia Commons in the public domain or under Creative Commons licences. They were resized and
            re-encoded as WebP; no other changes were made.
          </p>
        </div>
      </section>

      <ul className="grid gap-x-6 gap-y-12 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {references.map((r) => (
          <li key={r.id}>
            <ReferenceFigure image={r} crop="aspect-[4/3]" />
            <p className="meta mt-1 text-muted">Used for: {(withRefs.get(r.id) ?? []).join(", ")}</p>
          </li>
        ))}
      </ul>

      <section className="border-t border-ink py-10" aria-labelledby="missing-title">
        <h2 id="missing-title" className="text-h2 font-bold">
          Styles without a licensed reference yet
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          These {missing.length} styles currently rely on their illustrative study only. Many are recent or digital aesthetics whose
          defining works are still under copyright.
        </p>
        <ul className="mt-5 flex flex-wrap gap-1.5">
          {missing.map((s) => (
            <li key={s.slug}>
              <Link to={`/styles/${s.slug}`} className="chip">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
