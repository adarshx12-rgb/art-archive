import { ArrowDownToLine, ArrowUpToLine, Copy, FlipHorizontal2, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Layer } from "../lib/sketch/layers";

/**
 * A number you can drag left/right to change (like After Effects), or
 * click to type. Arrow keys step it; Shift steps ten times as far.
 */
function Scrub({
  label,
  value,
  onChange,
  step = 1,
  precision = 1,
  suffix = "",
  format,
  parse,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  precision?: number;
  suffix?: string;
  format?: (v: number) => string;
  parse?: (s: string) => number;
}) {
  const shown = format ? format(value) : value.toFixed(precision);
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; v: number; moved: boolean } | null>(null);

  const editing = draft !== null;
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  const commit = () => {
    if (draft === null) return;
    const n = parse ? parse(draft) : Number(draft.replace(/[^\d.+-]/g, ""));
    if (Number.isFinite(n)) onChange(n);
    setDraft(null);
  };

  return (
    <span className="inline-flex items-baseline">
      <input
        ref={ref}
        aria-label={label}
        inputMode="decimal"
        value={draft ?? shown}
        readOnly={draft === null}
        onPointerDown={(e) => {
          if (draft !== null) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, v: value, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 2) d.moved = true;
          if (d.moved) onChange(d.v + Math.round(dx) * step * (e.shiftKey ? 10 : 1));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) {
            setDraft(shown);
            ref.current?.focus();
          }
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          } else if (draft === null && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            onChange(value + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
          }
        }}
        className={`w-[5.5ch] min-w-0 bg-transparent text-right font-mono text-[0.9375rem] text-[#4E9BFF] tabular-nums outline-none ${
          draft === null ? "cursor-ew-resize underline decoration-dotted underline-offset-4" : "rounded bg-field px-1 text-ink ring-1 ring-ink"
        }`}
        style={{ width: `${Math.max(shown.length, 4) + 1}ch` }}
      />
      {suffix && <span className="ml-0.5 font-mono text-sm text-muted">{suffix}</span>}
    </span>
  );
}

function Row({ name, onReset, children }: { name: string; onReset: () => void; children: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-2 border-t border-rule py-1.5 first:border-t-0">
      <button type="button" onClick={onReset} className="text-muted hover:text-ink" title={`Reset ${name.toLowerCase()}`} aria-label={`Reset ${name.toLowerCase()}`}>
        <RotateCcw size={13} aria-hidden />
      </button>
      <span className="w-20 shrink-0 text-sm">{name}</span>
      <span className="flex flex-wrap items-baseline gap-x-3">{children}</span>
    </div>
  );
}

/** Rotation shown After Effects style: turns and degrees, e.g. "1x +45.0°". */
const formatTurns = (deg: number) => {
  const turns = Math.trunc(deg / 360);
  const rest = deg - turns * 360;
  return `${turns}x${rest < 0 ? "" : "+"}${rest.toFixed(1)}`;
};
const parseTurns = (s: string) => {
  const m = s.replace(/\s|°/g, "").match(/^(-?\d+)x([+-]?\d*\.?\d+)$/i);
  return m ? Number(m[1]) * 360 + Number(m[2]) : Number(s.replace(/[^\d.+-]/g, ""));
};

export interface TransformPanelProps {
  layer: Layer;
  /** Frame size in sketch units, so position reads in pixels. */
  frame: { w: number; h: number };
  onChange: (patch: Partial<Layer>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOrder: (dir: 1 | -1) => void;
}

/** Transform controls for the selected subject, modelled on Premiere Pro / After Effects "Effect Controls". */
export function TransformPanel({ layer, frame, onChange, onDelete, onDuplicate, onOrder }: TransformPanelProps) {
  return (
    <section aria-label={`Transform: ${layer.label}`} className="rounded-xl border border-rule bg-field/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-2">
        <p className="text-sm">
          <span className="meta text-muted">Transform</span> <span className="font-semibold">{layer.label}</span>
        </p>
        <div className="flex flex-wrap gap-1">
          <button type="button" className="btn btn-ghost btn-sm" aria-pressed={layer.flip} onClick={() => onChange({ flip: !layer.flip })} title="Flip horizontally">
            <FlipHorizontal2 size={14} aria-hidden />
            Flip
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOrder(1)} title="Bring forward">
            <ArrowUpToLine size={14} aria-hidden />
            <span className="sr-only">Bring forward</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOrder(-1)} title="Send backward">
            <ArrowDownToLine size={14} aria-hidden />
            <span className="sr-only">Send backward</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate">
            <Copy size={14} aria-hidden />
            <span className="sr-only">Duplicate</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete} title="Delete">
            <Trash2 size={14} aria-hidden />
            <span className="sr-only">Delete</span>
          </button>
        </div>
      </div>
      <div className="pt-1">
        <Row name="Position" onReset={() => onChange({ x: 0.5, y: 0.5 })}>
          <Scrub label="Position X" value={layer.x * frame.w} onChange={(v) => onChange({ x: v / frame.w })} />
          <Scrub label="Position Y" value={layer.y * frame.h} onChange={(v) => onChange({ y: v / frame.h })} />
        </Row>
        <Row name="Scale" onReset={() => onChange({ scale: 1 })}>
          <Scrub label="Scale" value={layer.scale * 100} onChange={(v) => onChange({ scale: Math.min(Math.max(v / 100, 0.05), 8) })} suffix="%" />
        </Row>
        <Row name="Rotation" onReset={() => onChange({ rotation: 0 })}>
          <Scrub label="Rotation" value={layer.rotation} onChange={(v) => onChange({ rotation: Math.round(v * 10) / 10 })} step={0.5} format={formatTurns} parse={parseTurns} suffix="°" />
        </Row>
      </div>
      <p className="meta mt-2 text-muted">Drag a value or click to type. On the sketch: drag to move, a corner to scale, the top handle to rotate. Arrow keys nudge; Delete removes.</p>
    </section>
  );
}
