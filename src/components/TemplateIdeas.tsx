import { Lightbulb, LoaderCircle, RefreshCw } from "lucide-react";
import type { Idea } from "../lib/ai";

export interface TemplateIdeasProps {
  /** e.g. "poster". */
  format: string;
  ideas: Idea[] | null;
  loading: boolean;
  /** The design changed since these ideas were made. */
  stale: boolean;
  /** Something else is being applied right now. */
  busy: boolean;
  onRefresh: () => void;
  onApply: (idea: Idea) => void;
}

/** Under the subject box when a template is in use: a few concrete ways to make the design better, each one click to apply. */
export function TemplateIdeas({ format, ideas, loading, stale, busy, onRefresh, onApply }: TemplateIdeasProps) {
  return (
    <div className="mt-4 rounded-lg border border-rule p-3" aria-live="polite">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="shrink-0 text-muted" aria-hidden />
        <p className="flex-1 text-sm font-semibold">Ideas for this {format}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loading} aria-label="More ideas" title="More ideas">
          {loading ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
        </button>
      </div>
      {loading && !ideas?.length && <p className="meta mt-2 text-muted">Looking at your layout…</p>}
      {stale && !loading && ideas && ideas.length > 0 && (
        <p className="meta mt-2 text-muted">
          Your design has changed.{" "}
          <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={onRefresh}>
            Refresh the ideas
          </button>
        </p>
      )}
      {ideas && ideas.length === 0 && !loading && <p className="meta mt-2 text-muted">Nothing to add right now. Refresh after your next change.</p>}
      {ideas && ideas.length > 0 && (
        <ul className="mt-2 space-y-2">
          {ideas.map((idea, i) => (
            <li key={`${idea.title}-${i}`} className="flex items-start gap-2 border-t border-rule pt-2 first:border-t-0 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{idea.title}</p>
                <p className="meta text-muted">{idea.kind === "words" ? `“${idea.words}”. ${idea.why}` : idea.why}</p>
              </div>
              <button type="button" className="btn btn-sm btn-ghost shrink-0" disabled={busy} onClick={() => onApply(idea)}>
                Try
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
