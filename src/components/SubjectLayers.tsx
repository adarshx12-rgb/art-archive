import { Plus, Sparkles, X } from "lucide-react";
import { MAX_ACTORS } from "../lib/scene/model";

export interface SubjectLayersProps {
  /** What's typed in the subject box right now. */
  draft: string;
  /** Subjects nearest the camera first, then placed text; the first non-text one is the main subject. */
  subjects: { id: string; label: string; text?: boolean }[];
  selectedId: string | null;
  /** Add the typed subject or object to the sketch; its shape comes from the words. */
  onAddDraft: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  /** Build (empty scene) or edit (existing scene) the scene with AI from the typed text. */
  onAi?: () => void;
  aiBusy?: boolean;
}

/** Under the subject box: ADD + puts the typed subject or object on the sketch; the list orders subjects front to back. */
export function SubjectLayers({ draft, subjects, selectedId, onAddDraft, onSelect, onRename, onDelete, onAi, aiBusy = false }: SubjectLayersProps) {
  const full = subjects.length >= MAX_ACTORS;
  const hasDraft = draft.trim().length > 0;
  const mainId = subjects.find((s) => !s.text)?.id;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" disabled={full || !hasDraft} onClick={onAddDraft}>
          ADD
          <Plus size={14} aria-hidden />
          <span className="sr-only">the typed subject or object to the sketch</span>
        </button>
        {onAi && (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={!hasDraft || aiBusy}
            onClick={onAi}
            title={subjects.length ? "Change the scene as the text describes, e.g. “make the dog sit by the door”" : "Build the whole scene from the text"}
          >
            <Sparkles size={14} aria-hidden />
            {aiBusy ? "Thinking…" : subjects.length ? "Edit scene" : "Build scene"}
          </button>
        )}
        <span className="meta text-muted">
          {full ? `Up to ${MAX_ACTORS} subjects.` : hasDraft ? "Enter also adds it." : "Type a subject or object, then ADD +."}
        </span>
      </div>

      {subjects.length > 0 && (
        <div>
          <p className="meta mb-1.5 text-muted">Nearest the camera first. The nearest is the main subject; move subjects to change it.</p>
          {/* Compact chips that wrap, so many subjects take little room. */}
          <ol className="flex flex-wrap gap-1.5">
            {subjects.map((l, i) => {
              const on = l.id === selectedId;
              const main = l.id === mainId;
              const tag = l.text ? "T" : main ? "main" : i + 1;
              return (
                <li key={l.id} className={`flex max-w-full items-center rounded-full border pl-0.5 ${on ? "border-[#4E9BFF] bg-field" : "border-rule"}`}>
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
                    className={`min-w-[3ch] max-w-full bg-transparent py-1 pl-1 text-sm outline-none ${l.text ? "font-semibold" : ""}`}
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
