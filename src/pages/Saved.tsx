import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { PaletteCard, StyleCard } from "../components/cards";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getPalette } from "../content/palettes";
import { getStyle } from "../content/styles";
import type { PaletteRecord, StyleRecord } from "../content/types";
import { useMeta } from "../lib/useMeta";
import { useSaved } from "../state/saved";

export function Saved() {
  useMeta("Saved", "Styles and palettes you have saved in this browser.");
  const { saved, persistent, clear } = useSaved();
  const [confirm, setConfirm] = useState<null | "styles" | "palettes">(null);
  const savedStyles = saved.styles.map(getStyle).filter((s): s is StyleRecord => Boolean(s));
  const savedPalettes = saved.palettes.map(getPalette).filter((p): p is PaletteRecord => Boolean(p));

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="font-display text-h1 font-normal lg:col-span-7">Saved</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Your own shortlist. It lives in this browser, so there’s no account to make; clearing site data removes it.
        </p>
      </header>

      {!persistent && (
        <p role="alert" className="mt-6 flex gap-2 border border-alert p-4 text-[0.9375rem]">
          <AlertTriangle size={18} className="shrink-0 text-alert" aria-hidden />
          Your browser is blocking local storage, so saved items will be lost when you close or refresh this page.
        </p>
      )}

      <section className="py-10" aria-labelledby="saved-styles">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
          <h2 id="saved-styles" className="font-display text-h2 font-normal">
            Styles <span className="meta align-middle text-muted">{savedStyles.length}</span>
          </h2>
          {savedStyles.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm("styles")}>
              <Trash2 size={14} aria-hidden />
              Clear styles
            </button>
          )}
        </div>
        {savedStyles.length === 0 ? (
          <div className="py-10">
            <p className="text-lg">No saved styles yet.</p>
            <p className="mt-1 text-muted">Nothing here yet. Save a style you want to come back to and it will wait for you here.</p>
            <Link to="/styles" className="btn btn-primary mt-5">
              Browse styles
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedStyles.map((s) => (
              <li key={s.slug}>
                <StyleCard style={s} />
                <Link to={`/builder?s=${s.slug}`} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="mt-3 inline-block text-sm underline underline-offset-2">
                  Use in builder
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="py-10" aria-labelledby="saved-palettes">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
          <h2 id="saved-palettes" className="font-display text-h2 font-normal">
            Palettes <span className="meta align-middle text-muted">{savedPalettes.length}</span>
          </h2>
          {savedPalettes.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm("palettes")}>
              <Trash2 size={14} aria-hidden />
              Clear palettes
            </button>
          )}
        </div>
        {savedPalettes.length === 0 ? (
          <div className="py-10">
            <p className="text-lg">No saved palettes yet.</p>
            <p className="mt-1 text-muted">Nothing here yet. Save a palette to try it against different styles later.</p>
            <Link to="/palettes" className="btn btn-primary mt-5">
              Browse palettes
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {savedPalettes.map((p) => (
              <li key={p.slug}>
                <PaletteCard palette={p} />
                <Link to={`/builder?p=${p.slug}`} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="mt-3 inline-block text-sm underline underline-offset-2">
                  Use in builder
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "styles" ? "Clear all saved styles?" : "Clear all saved palettes?"}
        body="This removes them from this browser. It can’t be undone."
        confirmLabel={confirm === "styles" ? "Clear styles" : "Clear palettes"}
        onConfirm={() => {
          if (confirm) clear(confirm);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
