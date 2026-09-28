import { Aperture, Clapperboard, ChevronUp, Check, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { palettes } from "../content/palettes";
import type { StyleRecord } from "../content/types";
import type { ResolvedPalette } from "../lib/prompt/compose";
import {
  angleOptions,
  compositionOptions,
  eraOptions,
  findOption,
  genreOptions,
  lensOptions,
  lightingOptions,
  shotOptions,
  type LightingId,
} from "../lib/prompt/options";
import type { BuilderState } from "../lib/prompt/state";

type PresetId = "film" | "camera" | "colour" | "lighting";

/** A rough colour for each lighting choice, for the thumbnail and chips. */
const LIGHT_SWATCH: Record<LightingId, string> = {
  style: "linear-gradient(135deg,#6d6a63,#2b2a27)",
  "soft-daylight": "linear-gradient(160deg,#f4f1e8,#b9c7d4)",
  "golden-hour": "linear-gradient(160deg,#ffb35c,#8a3b1c)",
  studio: "linear-gradient(160deg,#ffffff,#9a9a9a)",
  overcast: "linear-gradient(160deg,#b8bec6,#6b7179)",
  night: "linear-gradient(160deg,#1c2350,#05060f)",
  candlelight: "radial-gradient(circle at 50% 60%,#ffcf7a,#3a1a06 70%)",
  "hard-flash": "radial-gradient(circle at 50% 45%,#ffffff,#1a1a1a 75%)",
  backlit: "radial-gradient(circle at 50% 40%,#fff1c9,#2a2320 70%)",
};

function Chips<T extends string>({ label, options, value, onChange, disabled }: { label: string; options: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="meta mb-2 text-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-sm disabled:opacity-40 ${on ? "border-ink bg-ink text-paper" : "border-rule-strong hover:border-ink"}`}
            >
              {on && <Check size={13} aria-hidden />}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Pill({ label, value, thumb, open, onClick }: { label: string; value: string; thumb: ReactNode; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`flex min-w-[10.5rem] shrink-0 items-center gap-3 rounded-xl border p-2 pr-4 text-left transition-colors ${open ? "border-ink bg-field" : "border-rule bg-field/70 hover:border-rule-strong"}`}
    >
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-rule">{thumb}</span>
      <span className="min-w-0">
        <span className="meta block text-muted">{label}</span>
        <span className="block max-w-[9rem] truncate text-[0.9375rem] font-semibold">{value}</span>
      </span>
    </button>
  );
}

export interface PresetBarProps {
  state: BuilderState;
  style: StyleRecord;
  palette: ResolvedPalette;
  keepColours: boolean;
  keepComposition: boolean;
  set: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void;
  /** Use the style's own colours. */
  onStylePalette: () => void;
  onCurated: (slug: string) => void;
  onCustom: () => void;
  /** Ask the AI for a palette; resolves to a note to show, or an error message. */
  onAiPalette?: (request: string) => Promise<{ ok: boolean; message: string }>;
}

/** Cinema-style quick settings under the sketch. Each pill opens a panel of choices. */
export function PresetBar({ state, style, palette, keepColours, keepComposition, set, onStylePalette, onCurated, onCustom, onAiPalette }: PresetBarProps) {
  const [mood, setMood] = useState("");
  const [asking, setAsking] = useState(false);
  const [aiNote, setAiNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [open, setOpen] = useState<PresetId | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDown);
    };
  }, [open]);

  const toggle = (id: PresetId) => setOpen((o) => (o === id ? null : id));
  const labelOf = <T extends { id: string; label: string }>(list: readonly T[], id: string) => findOption(list, id)?.label ?? "";

  const filmValue = [state.genre !== "auto" && labelOf(genreOptions, state.genre), state.era !== "auto" && labelOf(eraOptions, state.era)].filter(Boolean).join(", ") || "Auto";
  const cameraValue = keepComposition
    ? "From source"
    : [
        state.shot !== "auto" && labelOf(shotOptions, state.shot),
        state.angle !== "auto" && labelOf(angleOptions, state.angle),
        state.lens !== "auto" && labelOf(lensOptions, state.lens).split(" ")[0],
      ].filter(Boolean).join(", ") || "Auto";
  const colourValue = keepColours ? "Original" : state.paletteMode === "style" ? "Auto" : palette.label;
  const lightValue = state.lighting === "style" ? "Auto" : labelOf(lightingOptions, state.lighting);

  return (
    <div ref={ref} className="flex flex-col">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Scene presets">
        <Pill label="Film setup" value={filmValue} open={open === "film"} onClick={() => toggle("film")} thumb={<Clapperboard size={20} aria-hidden />} />
        <Pill label="Camera" value={cameraValue} open={open === "camera"} onClick={() => toggle("camera")} thumb={<Aperture size={20} aria-hidden />} />
        <Pill
          label="Colour palette"
          value={colourValue}
          open={open === "colour"}
          onClick={() => toggle("colour")}
          thumb={
            <span className="grid size-full grid-cols-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ background: palette.colours[i % palette.colours.length]!.hex }} />
              ))}
            </span>
          }
        />
        <Pill label="Lighting" value={lightValue} open={open === "lighting"} onClick={() => toggle("lighting")} thumb={<span className="size-full" style={{ background: LIGHT_SWATCH[state.lighting] }} aria-hidden />} />
      </div>
      {open && (
        <div role="region" aria-label={`${open} settings`} className="order-last mt-2 rounded-xl border border-ink bg-paper p-4">
          {open === "film" && (
            <div className="space-y-4">
              <Chips label="Genre" options={genreOptions} value={state.genre} onChange={(v) => set("genre", v)} />
              <Chips label="Era" options={eraOptions} value={state.era} onChange={(v) => set("era", v)} />
              <p className="meta text-muted">Sets the tone and period. Auto leaves them to the style.</p>
            </div>
          )}
          {open === "camera" && (
            <div className="space-y-4">
              {keepComposition && <p className="border-l-2 border-ink pl-3 text-sm text-muted">You’re preserving your source’s composition, so camera settings aren’t added to the prompt.</p>}
              <Chips label="Shot size" options={shotOptions} value={state.shot} onChange={(v) => set("shot", v)} disabled={keepComposition} />
              <Chips label="Angle" options={angleOptions} value={state.angle} onChange={(v) => set("angle", v)} disabled={keepComposition} />
              <Chips label="Lens" options={lensOptions} value={state.lens} onChange={(v) => set("lens", v)} disabled={keepComposition} />
              <Chips label="Subject placement" options={compositionOptions} value={state.composition} onChange={(v) => set("composition", v)} disabled={keepComposition} />
            </div>
          )}
          {open === "colour" && (
            <div className="space-y-3">
              {keepColours ? (
                <p className="border-l-2 border-ink pl-3 text-sm text-muted">You’re preserving your source’s original colours. Untick “Original colours” to use a palette.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={state.paletteMode === "style"} onClick={onStylePalette} className={`btn btn-sm ${state.paletteMode === "style" ? "btn-primary" : "btn-ghost"}`}>
                      Auto: {style.name} colours
                    </button>
                    <button type="button" aria-pressed={state.paletteMode === "custom"} onClick={() => { onCustom(); setOpen(null); }} className={`btn btn-sm ${state.paletteMode === "custom" ? "btn-primary" : "btn-ghost"}`}>
                      Custom colours…
                    </button>
                  </div>
                  {onAiPalette && (
                    <form
                      className="rounded-lg border border-rule p-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!mood.trim() || asking) return;
                        setAsking(true);
                        setAiNote(await onAiPalette(mood.trim()));
                        setAsking(false);
                      }}
                    >
                      <label htmlFor="ai-mood" className="meta mb-1 block text-muted">
                        Suggest {state.count} colours with AI
                      </label>
                      <div className="flex gap-2">
                        <input id="ai-mood" value={mood} maxLength={400} onChange={(e) => setMood(e.target.value)} placeholder="e.g. misty harbour at dawn, calm and cold" className="field min-w-0 flex-1 py-1.5 text-sm" />
                        <button type="submit" className="btn btn-sm btn-primary" disabled={asking || !mood.trim()}>
                          <Sparkles size={14} aria-hidden />
                          {asking ? "Thinking…" : "Suggest"}
                        </button>
                      </div>
                      {aiNote && <p className={`mt-1.5 text-sm ${aiNote.ok ? "text-muted" : "text-alert"}`} role="status">{aiNote.message}</p>}
                    </form>
                  )}
                  <p className="meta text-muted">Curated palettes</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {palettes.map((p) => {
                      const on = state.paletteMode === "curated" && state.palette === p.slug;
                      return (
                        <li key={p.slug}>
                          <button type="button" aria-pressed={on} onClick={() => onCurated(p.slug)} className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left text-sm ${on ? "border-ink bg-field" : "border-rule hover:border-rule-strong"}`}>
                            <span className="flex h-6 w-16 shrink-0 overflow-hidden rounded" aria-hidden>
                              {p.colours.map((c) => (
                                <span key={c.hex} style={{ background: c.hex, flex: c.share }} />
                              ))}
                            </span>
                            <span className="truncate">{p.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
          {open === "lighting" && (
            <div className="space-y-3">
              <div className="grid gap-1.5 sm:grid-cols-3">
                {lightingOptions.map((o) => {
                  const on = state.lighting === o.id;
                  return (
                    <button key={o.id} type="button" aria-pressed={on} onClick={() => set("lighting", o.id)} className={`flex items-center gap-2 rounded-lg border p-1.5 text-left text-sm ${on ? "border-ink bg-field" : "border-rule hover:border-rule-strong"}`}>
                      <span className="size-7 shrink-0 rounded" style={{ background: LIGHT_SWATCH[o.id] }} aria-hidden />
                      {o.id === "style" ? "Auto" : o.label}
                    </button>
                  );
                })}
              </div>
              {state.lighting === "style" && <p className="meta text-muted">Auto uses the style’s light: {style.look.lighting}.</p>}
            </div>
          )}
          <button type="button" className="meta mt-4 inline-flex items-center gap-1 text-muted hover:text-ink" onClick={() => setOpen(null)}>
            <ChevronUp size={13} aria-hidden />
            Close
          </button>
        </div>
      )}

    </div>
  );
}
