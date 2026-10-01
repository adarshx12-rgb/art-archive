import { Link } from "react-router";
import { ReferenceFigure } from "../art/ReferenceFigure";
import { references } from "../content/references";
import { allStyles, getStyle, styles } from "../content/styles";
import { useMeta } from "../lib/useMeta";

export function Credits() {
  useMeta("Image credits", "Which images are AI-generated illustrations, which are illustrative studies, and the sources and licences of the historical references.");
  // Every style that uses a reference, including styles not shown yet (they have no page to link to).
  const withRefs = new Map<string, { slug: string; name: string }[]>();
  for (const s of allStyles) for (const r of s.references) withRefs.set(r, [...(withRefs.get(r) ?? []), { slug: s.slug, name: s.name }]);
  const missing = styles.filter((s) => s.references.length === 0);

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="font-display text-h1 font-normal lg:col-span-7">Image credits</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Three kinds of artwork appear on this site, and each is labelled so you can tell them apart.
        </p>
      </header>

      <section className="grid gap-8 border-b border-rule py-10 md:grid-cols-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">AI-generated illustrations</h2>
          <p className="mt-2 text-muted">
            The main image for each style, and the extra images on some style pages, were made with AI for
            this library. They show what a style looks like; they are not historical artworks and don’t copy any particular work. Each one
            is labelled “AI-generated illustration”, and the style page’s Prompts section has the prompt it was made from.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Illustrative studies</h2>
          <p className="mt-2 text-muted">
            Simple SVG drawings made by hand for this library, one per style. They appear on palette pages, where a style is shown in
            the palette’s colours, because an illustration can’t be recoloured. They are labelled “Illustrative
            study”.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">References</h2>
          <p className="mt-2 text-muted">
            Photographs and scans from Wikimedia Commons in the public domain or under Creative Commons licences. They were resized and
            re-encoded as WebP; no other changes were made. Each is credited with its author, source and licence.
          </p>
        </div>
      </section>

      <ul className="grid gap-x-6 gap-y-12 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {references.map((r) => (
          <li key={r.id}>
            <ReferenceFigure image={r} crop="aspect-[4/3]" />
            <UsedFor list={withRefs.get(r.id) ?? []} />
          </li>
        ))}
      </ul>

      <section className="border-t border-ink py-10" aria-labelledby="missing-title">
        <h2 id="missing-title" className="font-display text-h2 font-normal">
          Styles without a licensed reference yet
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          These {missing.length} styles are shown only with their AI-generated illustration. Many are recent or digital aesthetics whose
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

/** The styles a reference is used for. Styles without a page yet are named without a link; nothing is shown when there are none. */
function UsedFor({ list }: { list: { slug: string; name: string }[] }) {
  if (!list.length) return null;
  return (
    <p className="meta mt-1 text-muted">
      Used for:{" "}
      {list.map((s, i) => (
        <span key={s.slug}>
          {i > 0 && ", "}
          {getStyle(s.slug) ? (
            <Link to={`/styles/${s.slug}`} className="underline underline-offset-2 hover:text-ink">
              {s.name}
            </Link>
          ) : (
            <>{s.name} (coming soon)</>
          )}
        </span>
      ))}
    </p>
  );
}
