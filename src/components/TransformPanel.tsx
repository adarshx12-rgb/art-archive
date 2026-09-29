import { Copy, FlipHorizontal2, RotateCcw, Trash2, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { POSES, type Actor, type Vec3 } from "../lib/scene/model";

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

/** True in the narrow panel beside the preview: each row puts its values under its name. */
const Vertical = createContext(false);

function Row({ name, onReset, children }: { name: string; onReset: () => void; children: React.ReactNode }) {
  const vertical = useContext(Vertical);
  return (
    <div className={`flex min-h-9 gap-2 border-t border-rule py-1.5 first:border-t-0 ${vertical ? "flex-col gap-1" : "items-center"}`}>
      <span className="flex items-center gap-2">
        <button type="button" onClick={onReset} className="text-muted hover:text-ink" title={`Reset ${name.toLowerCase()}`} aria-label={`Reset ${name.toLowerCase()}`}>
          <RotateCcw size={13} aria-hidden />
        </button>
        <span className="w-20 shrink-0 text-sm">{name}</span>
      </span>
      <span className={`flex flex-wrap items-baseline gap-x-3 ${vertical ? "pl-5" : ""}`}>{children}</span>
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
  actor: Actor;
  onChange: (patch: Partial<Actor>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  /** The 2D board: only moves, resizing and tilting within the picture. */
  flat?: boolean;
  /** Closes the panel; the subject stays. */
  onClose: () => void;
  /** Narrow and stacked, for the space beside the preview. */
  vertical?: boolean;
}

const FIGURES = new Set(["person", "child", "robot"]);

/** Transform controls for the selected subject, modelled on After Effects / Premiere "Effect Controls". */
export function TransformPanel({ actor, onChange, onDelete, onDuplicate, onClose, flat = false, vertical = false }: TransformPanelProps) {
  const [px, py, pz] = actor.position;
  const [rx, ry, rz] = actor.rotation;
  const setPos = (i: 0 | 1 | 2, v: number) => onChange({ position: actor.position.map((p, j) => (j === i ? Math.round(v * 100) / 100 : p)) as Vec3 });
  const setRot = (i: 0 | 1 | 2, v: number) => onChange({ rotation: actor.rotation.map((p, j) => (j === i ? Math.round(v * 10) / 10 : p)) as Vec3 });
  return (
    <Vertical.Provider value={vertical}>
    <section aria-label={`Transform: ${actor.label}`} className="rounded-xl border border-rule bg-field/70 p-3">
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-2 ${vertical ? "flex-col items-stretch" : ""}`}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm">
            <span className="meta text-muted">Transform</span> <span className="font-semibold">{actor.label}</span>
          </p>
          {vertical && <CloseButton onClose={onClose} />}
        </div>
        <div className="flex flex-wrap gap-1">
          {flat ? (
            // Mirror left/right (a subject facing the camera stays facing it).
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ rotation: [rx, -ry, rz] })} title="Flip left/right">
              <FlipHorizontal2 size={14} aria-hidden />
              Flip
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ rotation: [rx, ry + 180, rz] })} title="Turn around (rotate 180° on Y)">
              <FlipHorizontal2 size={14} aria-hidden />
              Turn
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate">
            <Copy size={14} aria-hidden />
            <span className="sr-only">Duplicate</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete} title="Delete">
            <Trash2 size={14} aria-hidden />
            <span className="sr-only">Delete</span>
          </button>
          {!vertical && <CloseButton onClose={onClose} />}
        </div>
      </div>
      <div className="pt-1">
        <Row name="Position" onReset={() => onChange({ position: flat ? [0, 0, pz] : [0, actor.position[1] > 30 ? actor.position[1] : 0, 0] })}>
          <Scrub label="Position X" value={px} onChange={(v) => setPos(0, v)} step={0.05} precision={2} suffix="m" />
          <Scrub label="Position Y" value={py} onChange={(v) => setPos(1, v)} step={0.05} precision={2} suffix="m" />
          {!flat && <Scrub label="Position Z" value={pz} onChange={(v) => setPos(2, v)} step={0.05} precision={2} suffix="m" />}
        </Row>
        {flat ? (
          <Row name="Rotation" onReset={() => onChange({ rotation: [rx, ry, 0] })}>
            <Scrub label="Rotation" value={rz} onChange={(v) => setRot(2, v)} step={0.5} format={formatTurns} parse={parseTurns} suffix="°" />
          </Row>
        ) : (
          <Row name="Rotation" onReset={() => onChange({ rotation: [0, 0, 0] })}>
            <Scrub label="Rotation X" value={rx} onChange={(v) => setRot(0, v)} step={0.5} format={formatTurns} parse={parseTurns} suffix="°" />
            <Scrub label="Rotation Y" value={ry} onChange={(v) => setRot(1, v)} step={0.5} format={formatTurns} parse={parseTurns} suffix="°" />
            <Scrub label="Rotation Z" value={rz} onChange={(v) => setRot(2, v)} step={0.5} format={formatTurns} parse={parseTurns} suffix="°" />
          </Row>
        )}
        <Row name="Scale" onReset={() => onChange({ scale: 1 })}>
          <Scrub label="Scale" value={actor.scale * 100} onChange={(v) => onChange({ scale: Math.min(Math.max(v / 100, 0.05), 20) })} suffix="%" />
        </Row>
        {FIGURES.has(actor.glyph) && (
          <Row name="Pose" onReset={() => onChange({ pose: "stand" })}>
            <select aria-label="Pose" value={actor.pose} onChange={(e) => onChange({ pose: e.target.value as Actor["pose"] })} className="rounded border border-rule-strong bg-transparent px-1.5 py-1 text-sm">
              {POSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Row>
        )}
      </div>
      <p className="meta mt-2 text-muted">
        {vertical
          ? "Drag a value or click to type."
          : flat
          ? "X is left–right, Y is up (metres). Rotation tilts the subject within the picture. Drag a value or click to type."
          : "X is left–right, Y is up, Z is towards the camera (metres). Rotation Y turns the subject; 0° faces the camera. Drag a value or click to type."}
      </p>
    </section>
    </Vertical.Provider>
  );
}

/** Hides the panel by deselecting; nothing is removed. */
function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="shrink-0 rounded p-1 text-muted hover:text-ink" onClick={onClose} title="Close (the subject stays)" aria-label="Close transform panel">
      <X size={16} aria-hidden />
    </button>
  );
}
