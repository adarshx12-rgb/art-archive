import { LoaderCircle, Plus, X } from "lucide-react";
import { MAX_ACTORS } from "../lib/scene/model";

export interface SubjectLayersProps {
  /** What's typed in the subject box right now. */
  draft: string;
  /** Subjects nearest the camera first, then placed text; the first non-text one is the main subject. */
  subjects: { id: string; label: string; text?: boolean }[];
  selectedId: string | null;
  /** Add the typed subject, or lay out what the words describe ("a cat on a table"). */
  onAddDraft: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  /** Set while a described layout is being worked out. */
  busy?: boolean;
}

/** Under the subject box: ADD + puts what's typed on the sketch; the list orders subjects front to back. */
export function SubjectLayers({ draft, subjects, selectedId, onAddDraft, onSelect, onRename, onDelete, busy = false }: SubjectLayersProps) {
  const full = subjects.length >= MAX_ACTORS;
  const hasDraft = draft.trim().length > 0;
  const mainId = subjects.find((s) => !s.text)?.id;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" disabled={full || !hasDraft || busy} aria-busy={busy} onClick={onAddDraft}>
          ADD
          {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Plus size={14} aria-hidden />}
          <span className="sr-only">{busy ? "Placing…" : "what's typed to the sketch"}</span>
        </button>
        <span className="meta text-muted">
          {busy ? "Placing…" : full ? `Up to ${MAX_ACTORS} subjects.` : hasDraft ? "Enter also adds it." : "Type a subject, or describe the scene: “a cloud with cows below”."}
        </span>
      </div>

      {subjects.length > 0 && (
        <div>
          <p className="meta mb-1.5 text-muted">Nearest the camera first. The nearest is the main subject; move subjects to change it.</p>
          {/* Compact chips that wrap, so many subjects take little room. */}
          <ol className="flex min-w-0 flex-wrap gap-1.5">
            {subjects.map((l, i) => {
              const on = l.id === selectedId;
              const main = l.id === mainId;
              const tag = l.text ? "T" : main ? "main" : i + 1;
              return (
                <li key={l.id} className={`flex max-w-full min-w-0 items-center rounded-full border pl-0.5 ${on ? "border-[#4E9BFF] bg-field" : "border-rule"}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(l.id)}
                    aria-pressed={on}
                    className={`meta shrink-0 rounded-full px-1.5 py-0.5 ${main ? "bg-acid text-on-acid" : "text-muted hover:text-ink"}`}
                    title={l.text ? "Text · select on the sketch" : "Select on the sketch"}
                  >
                    {tag}
                  </button>
                  <input
                    aria-label={l.text ? `Text ${i + 1}` : `Name of subject ${i + 1}`}
                    value={l.label}
                    maxLength={80}
                    size={1}
                    onFocus={() => onSelect(l.id)}
                    onChange={(e) => onRename(l.id, e.target.value)}
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                    className={`min-w-[3ch] max-w-full shrink truncate bg-transparent py-1 pl-1 text-sm outline-none ${l.text ? "font-semibold" : ""}`}
                  />
                  <button type="button" onClick={() => onDelete(l.id)} className="shrink-0 p-1 pr-1.5 text-muted hover:text-ink" aria-label={`Remove ${l.label}`}>
                    <X size={12} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
