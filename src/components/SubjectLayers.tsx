import { Plus, Shapes, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_ACTORS } from "../lib/scene/model";
import { LAYER_TYPES } from "../lib/sketch/layers";
import type { Glyph } from "../lib/sketch/parse";

export interface SubjectLayersProps {
  /** What's typed in the subject box right now. */
  draft: string;
  /** Subjects nearest the camera first; the first is the main subject. */
  subjects: { id: string; label: string }[];
  selectedId: string | null;
  /** Add the typed subject to the sketch. */
  onAddDraft: () => void;
  /** Add a shape from the picker. */
  onPick: (glyph: Glyph, label: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

/** Under the subject box: ADD + puts the typed subject on the sketch; the list orders subjects front to back. */
export function SubjectLayers({ draft, subjects, selectedId, onAddDraft, onPick, onSelect, onRename, onDelete }: SubjectLayersProps) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const full = subjects.length >= MAX_ACTORS;
  const hasDraft = draft.trim().length > 0;

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);


  return (
    <div ref={ref} className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" disabled={full || !hasDraft} onClick={onAddDraft}>
          ADD
          <Plus size={14} aria-hidden />
          <span className="sr-only">the typed subject to the sketch</span>
        </button>
        <button type="button" className="btn btn-sm btn-ghost" aria-expanded={menu} disabled={full} onClick={() => setMenu((m) => !m)}>
          <Shapes size={14} aria-hidden />
          Pick a shape
        </button>
        <span className="meta text-muted">
          {full ? `Up to ${MAX_ACTORS} subjects.` : hasDraft ? "Enter also adds it." : "Type a subject, then ADD +."}
        </span>
      </div>

      {menu && (
        <div role="region" aria-label="Choose a subject" className="space-y-3 rounded-xl border border-ink bg-paper p-3">
          {LAYER_TYPES.map((g) => (
            <div key={g.group}>
              <p className="meta mb-1 text-muted">{g.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <button
                    key={it.label}
                    type="button"
                    onClick={() => {
                      onPick(it.glyph, it.label);
                      setMenu(false);
                    }}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-rule-strong px-2.5 text-sm capitalize hover:border-ink"
                  >
                    {it.label}
                    <Plus size={12} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {subjects.length > 0 && (
        <div>
          <p className="meta mb-1.5 text-muted">Nearest the camera first. The nearest is the main subject; move subjects to change it.</p>
          <ol className="space-y-1">
            {subjects.map((l, i) => {
              const on = l.id === selectedId;
              return (
                <li key={l.id} className={`flex items-center gap-1 rounded-lg border pl-1 ${on ? "border-[#4E9BFF] bg-field" : "border-rule"}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(l.id)}
                    aria-pressed={on}
                    className={`meta shrink-0 rounded px-1.5 py-1 ${i === 0 ? "bg-acid text-on-acid" : "text-muted hover:text-ink"}`}
                    title="Select on the sketch"
                  >
                    {i === 0 ? "main" : i + 1}
                  </button>
                  <input
                    aria-label={`Name of subject ${i + 1}`}
                    value={l.label}
                    maxLength={80}
                    onFocus={() => onSelect(l.id)}
                    onChange={(e) => onRename(l.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
                  />
                  <button type="button" onClick={() => onDelete(l.id)} className="p-1.5 pr-2 text-muted hover:text-ink" aria-label={`Remove ${l.label}`}>
                    <X size={14} aria-hidden />
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
