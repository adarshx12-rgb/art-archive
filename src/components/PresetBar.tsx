import { Aperture, Clapperboard, ChevronUp, Check, ExternalLink, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fontSuggestions } from "../content/fonts";
import type { Hex, PaletteSize, StyleRecord } from "../content/types";
import { styleSuggestions, type SuggestedPalette } from "../lib/prompt/suggest";
import type { AiResult, SchemesReply } from "../lib/ai";
import { useGooglePreview } from "./FontSuggestions";
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
  /** Use exactly these colours, as a custom palette. */
  onColours: (hexes: Hex[]) => void;
  onCustom: () => void;
  /** Ask for 2, 3 and 4-colour schemes for the style, optionally for a mood. */
  onAiSchemes?: (request: string) => Promise<AiResult<SchemesReply>>;
}

/** Cinema-style quick settings under the sketch. Each pill opens a panel of choices. */
export function PresetBar({ state, style, palette, keepColours, keepComposition, set, onStylePalette, onCurated, onColours, onCustom, onAiSchemes }: PresetBarProps) {
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
                  <StyleSuggestions
                    state={state}
                    style={style}
                    onPick={(o, size) => {
                      if (o.own) {
                        onStylePalette();
                        set("count", size);
                      } else if (o.slug) onCurated(o.slug);
                      else onColours(o.hexes);
                    }}
                  />
                  <div className="flex flex-wrap gap-2 border-t border-rule pt-3">
                    <button type="button" aria-pressed={state.paletteMode === "style"} onClick={onStylePalette} className={`btn btn-sm ${state.paletteMode === "style" ? "btn-primary" : "btn-ghost"}`}>
                      Auto: {style.name} colours
                    </button>
                    <button type="button" aria-pressed={state.paletteMode === "custom"} onClick={() => { onCustom(); setOpen(null); }} className={`btn btn-sm ${state.paletteMode === "custom" ? "btn-primary" : "btn-ghost"}`}>
                      Custom colours…
                    </button>
                  </div>
                  {onAiSchemes && <SchemeSuggestions style={style} state={state} onAsk={onAiSchemes} onPick={onColours} />}
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

/** Is this suggestion what the builder is using now? */
function isCurrent(o: SuggestedPalette, size: PaletteSize, state: BuilderState): boolean {
  if (state.count !== size) return false;
  if (o.own) return state.paletteMode === "style";
  if (o.slug) return state.paletteMode === "curated" && state.palette === o.slug;
  return state.paletteMode === "custom" && o.hexes.every((h, i) => state.custom[i]?.toUpperCase() === h.toUpperCase());
}

/** The top of the colour panel: palettes for the chosen style on the left, its fonts on the right. */
function StyleSuggestions({ state, style, onPick }: { state: BuilderState; style: StyleRecord; onPick: (o: SuggestedPalette, size: PaletteSize) => void }) {
  const groups = styleSuggestions(style);
  const fonts = fontSuggestions[style.slug] ?? [];
  // Preview each free font in its own face, using only the letters of the names shown.
  useGooglePreview(
    fonts.filter((f) => f.licence === "free").map((f) => f.family),
    [...new Set(fonts.map((f) => f.family).join(""))].join(""),
  );
  return (
    <section aria-label={`Suggested for ${style.name}`} className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="min-w-0">
        <p className="mb-2 text-sm font-semibold">Palettes for {style.name}</p>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.size}>
              <p className="meta mb-1 text-muted">{g.size === 1 ? "1 colour · background only" : `${g.size} colours`}</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {g.options.map((o) => {
                  const on = isCurrent(o, g.size, state);
                  return (
                    <li key={o.hexes.join()}>
                      <button type="button" aria-pressed={on} onClick={() => onPick(o, g.size)} className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left text-sm ${on ? "border-ink bg-field" : "border-rule hover:border-rule-strong"}`}>
                        <span className="flex h-6 w-16 shrink-0 overflow-hidden rounded border border-swatch-edge" aria-hidden>
                          {o.hexes.map((h, i) => (
                            <span key={i} className="flex-1" style={{ background: h }} />
                          ))}
                        </span>
                        <span className="truncate">{o.name}</span>
                        {on && <Check size={13} className="ml-auto shrink-0" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 lg:border-l lg:border-rule lg:pl-5">
        <p className="mb-2 text-sm font-semibold">Fonts for {style.name}</p>
        {fonts.length === 0 ? (
          <p className="text-sm text-muted">No font suggestions for this style yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {fonts.map((f) => (
              <li key={f.family} className="py-2 first:pt-0">
                <div className="flex items-baseline justify-between gap-2">
                  <a href={f.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-lg leading-tight hover:underline" style={f.licence === "free" ? { fontFamily: `"${f.family}", var(--font-sans, sans-serif)` } : undefined}>
                    {f.family}
                    <span className="sr-only"> (opens in a new tab)</span>
                    <ExternalLink size={11} className="ml-1 inline align-baseline opacity-60" aria-hidden />
                  </a>
                  <span className={`meta shrink-0 rounded-[2px] px-1.5 py-0.5 ${f.licence === "free" ? "bg-ink text-paper" : "border border-rule-strong"}`}>{f.licence === "free" ? "Free" : "Paid"}</span>
                </div>
                <p className="meta mt-0.5 text-muted">{f.role} · {f.why}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Asks for three fresh schemes (2, 3 and 4 colours) true to the style; click one to use it. */
function SchemeSuggestions({ style, state, onAsk, onPick }: { style: StyleRecord; state: BuilderState; onAsk: (request: string) => Promise<AiResult<SchemesReply>>; onPick: (hexes: Hex[]) => void }) {
  const [mood, setMood] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AiResult<SchemesReply> | null>(null);
  // Schemes are made for one style; a different style starts afresh.
  useEffect(() => setResult(null), [style.slug]);
  const isOn = (hexes: Hex[]) => state.paletteMode === "custom" && state.count === hexes.length && hexes.every((h, i) => state.custom[i]?.toUpperCase() === h);
  return (
    <form
      className="rounded-lg border border-rule p-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (asking) return;
        setAsking(true);
        setResult(await onAsk(mood.trim()));
        setAsking(false);
      }}
    >
      <label htmlFor="scheme-mood" className="meta mb-1 block text-muted">
        More colour schemes for {style.name} (optional mood or scene)
      </label>
      <div className="flex gap-2">
        <input id="scheme-mood" value={mood} maxLength={400} onChange={(e) => setMood(e.target.value)} placeholder="e.g. misty harbour at dawn, calm and cold" className="field min-w-0 flex-1 py-1.5 text-sm" />
        <button type="submit" className="btn btn-sm btn-primary shrink-0" disabled={asking}>
          <Sparkles size={14} aria-hidden />
          {asking ? "Thinking…" : "Suggest colour schemes"}
        </button>
      </div>
      {result && !result.ok && (
        <p className="mt-1.5 text-sm text-alert" role="status">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <ul className="mt-2 grid gap-1.5" role="status" aria-label="Suggested colour schemes">
          {result.data.schemes.map((sc) => {
            const hexes = sc.colours.map((c) => c.hex);
            const on = isOn(hexes);
            return (
              <li key={hexes.join()}>
                <button type="button" aria-pressed={on} onClick={() => onPick(hexes)} className={`flex w-full items-center gap-2 rounded-lg border p-1.5 text-left text-sm ${on ? "border-ink bg-field" : "border-rule hover:border-rule-strong"}`}>
                  <span className="flex h-8 w-20 shrink-0 overflow-hidden rounded border border-swatch-edge" aria-hidden>
                    {sc.colours.map((c) => (
                      <span key={c.hex} className="flex-1" style={{ background: c.hex }} title={`${c.name} ${c.hex}`} />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {sc.name} <span className="meta font-normal text-muted">· {sc.colours.length} colours</span>
                    </span>
                    <span className="block text-muted">{sc.why}</span>
                  </span>
                  {on && <Check size={13} className="ml-auto shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
