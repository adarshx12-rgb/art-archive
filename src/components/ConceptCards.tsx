import { LoaderCircle, RefreshCw } from "lucide-react";
import type { Concept } from "../lib/ai";

export interface ConceptCardsProps {
  concepts: Concept[] | null;
  loading: boolean;
  /** Settings changed since these concepts were made. */
  stale: boolean;
  /** A prompt is being written right now. */
  busy: boolean;
  /** Title of the concept the prompt was written from. */
  chosen: string | null;
  onMore: () => void;
  onUse: (concept: Concept) => void;
}

/** Three design directions for the current settings; picking one writes the prompt for it. */
export function ConceptCards({ concepts, loading, stale, busy, chosen, onMore, onUse }: ConceptCardsProps) {
  if (!concepts && !loading) return null;
  return (
    <div className="mt-4" aria-live="polite">
      {loading && <p className="meta mb-2 text-muted">Thinking like a designer…</p>}
      {stale && !loading && (
        <p className="meta mb-2 text-muted">
          Your settings changed since these ideas.{" "}
          <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={onMore}>
            Get new ideas
          </button>
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="h-40 animate-pulse rounded-lg border border-rule bg-field" aria-hidden />
            ))
          : concepts!.map((c) => (
              <li key={c.title} className={`flex flex-col rounded-lg border p-3 ${chosen === c.title ? "border-ink" : "border-rule"}`}>
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="mt-1 flex-1 text-sm">{c.idea}</p>
                {c.tags.length > 0 && <p className="meta mt-2 text-muted">{c.tags.join(" · ")}</p>}
                <button type="button" className="btn btn-sm mt-3 self-start" disabled={busy} onClick={() => onUse(c)}>
                  {chosen === c.title ? "Rewrite" : "Use this"}
                </button>
              </li>
            ))}
      </ul>
      {!loading && (
        <button type="button" className="btn btn-ghost btn-sm mt-3" disabled={busy} onClick={onMore}>
          {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
          More ideas
        </button>
      )}
    </div>
  );
}
