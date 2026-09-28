import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LAYER_TYPES, MAX_LAYERS, type Layer } from "../lib/sketch/layers";
import type { Glyph } from "../lib/sketch/parse";
import { parseSubject } from "../lib/sketch/parse";

export interface SubjectLayersProps {
  subject: string;
  layers: Layer[];
  selectedId: string | null;
  onAdd: (glyph: Glyph, label: string, from?: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

/** Under the subject box: add subjects to the sketch, from the text or from a menu, and list what's placed. */
export function SubjectLayers({ subject, layers, selectedId, onAdd, onSelect, onRename, onDelete }: SubjectLayersProps) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const full = layers.length >= MAX_LAYERS;
  const placed = new Set(layers.flatMap((l) => [l.label.toLowerCase(), l.from ?? ""]));
  const detected = parseSubject(subject).items.filter((i) => !placed.has(i.label));

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
    <div ref={ref} className="mt-3 space-y-3">
      {detected.length > 0 && (
        <div>
          <p className="meta mb-1.5 text-muted">In your subject: add to the sketch</p>
          <ul className="flex flex-wrap gap-1.5">
            {detected.map((d) => (
              <li key={d.label}>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => onAdd(d.glyph, d.label, d.label)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-rule-strong px-2.5 text-sm hover:border-ink disabled:opacity-40"
                >
                  {d.count > 1 ? `${d.label} ×${d.count}` : d.label}
                  <Plus size={13} aria-hidden />
                  <span className="sr-only">Add {d.label} to the sketch</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <button type="button" className="btn btn-sm btn-primary" aria-expanded={menu} disabled={full} onClick={() => setMenu((m) => !m)}>
          ADD
          <Plus size={14} aria-hidden />
          <span className="sr-only">a subject to the sketch</span>
        </button>
        {full && <span className="meta ml-2 text-muted">Up to {MAX_LAYERS} subjects.</span>}
        {menu && (
          <div role="region" aria-label="Choose a subject" className="mt-2 space-y-3 rounded-xl border border-ink bg-paper p-3">
            {LAYER_TYPES.map((g) => (
              <div key={g.group}>
                <p className="meta mb-1 text-muted">{g.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it) => (
                    <button
                      key={it.label}
                      type="button"
                      onClick={() => {
                        onAdd(it.glyph, it.label);
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
      </div>

      {layers.length > 0 && (
        <div>
          <p className="meta mb-1.5 text-muted">On the sketch (top of the list is in front)</p>
          <ul className="space-y-1">
            {[...layers].reverse().map((l) => {
              const on = l.id === selectedId;
              return (
                <li key={l.id} className={`flex items-center gap-1 rounded-lg border pl-1 ${on ? "border-[#4E9BFF] bg-field" : "border-rule"}`}>
                  <button type="button" onClick={() => onSelect(l.id)} aria-pressed={on} className="meta shrink-0 rounded px-1.5 py-1 text-muted hover:text-ink" title="Select on the sketch">
                    {l.glyph.replace("big-animal", "animal").replace("device", "object")}
                  </button>
                  <input
                    aria-label={`Name of ${l.label}`}
                    value={l.label}
                    maxLength={40}
                    onFocus={() => onSelect(l.id)}
                    onChange={(e) => onRename(l.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
                  />
                  <button type="button" onClick={() => onDelete(l.id)} className="p-2 text-muted hover:text-ink" aria-label={`Remove ${l.label}`}>
                    <X size={14} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="meta mt-1.5 text-muted">Rename a subject to describe it, e.g. “old fisherman in a yellow coat”.</p>
        </div>
      )}
    </div>
  );
}
