import { AlertTriangle, Download, Link2, RefreshCw, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate } from "react-router";
import { StyleArt } from "../art/StyleArt";
import { CopyButton } from "../components/actions";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { site } from "../config/site";
import { kindLabels } from "../content/facets";
import { palettes, getPalette } from "../content/palettes";
import { getStyle, styles } from "../content/styles";
import type { Hex, PaletteSize, StyleKind } from "../content/types";
import { copyText, downloadText, slugify } from "../lib/clipboard";
import { inkOn, normaliseHex } from "../lib/color";
import { composePrompt, resolvePalette, ROLE_ORDER } from "../lib/prompt/compose";
import {
  aspectOptions,
  cameraOptions,
  compositionOptions,
  durationOptions,
  lightingOptions,
  movementOptions,
  preserveOptions,
  type Intensity,
  type Output,
  type PaletteMode,
  type PreserveId,
  type Task,
} from "../lib/prompt/options";
import { decodeState, defaultState, encodeState, SUBJECT_MAX, type BuilderState } from "../lib/prompt/state";
import { useMeta } from "../lib/useMeta";
import { useToast } from "../state/toast";

// ——— Small form primitives ———

function Group({ legend, children, hint, id }: { legend: string; children: React.ReactNode; hint?: React.ReactNode; id?: string }) {
  return (
    <fieldset className="border-t border-rule py-5" id={id}>
      <legend className="float-left mb-3 w-full text-[0.9375rem] font-semibold">{legend}</legend>
      <div className="clear-both">
        {children}
        {hint && <div className="meta mt-2 text-muted">{hint}</div>}
      </div>
    </fieldset>
  );
}

function Segmented<T extends string | number>({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <label key={String(o.id)}>
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} disabled={disabled} />
          {value === o.id && <span aria-hidden>✓</span>}
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Select<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="meta mb-1.5 block text-muted">
        {label}
      </label>
      <select
        id={id}
        className="field"
        value={String(value)}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value;
          const match = options.find((o) => String(o.id) === raw);
          if (match) onChange(match.id);
        }}
      >
        {options.map((o) => (
          <option key={String(o.id)} value={String(o.id)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Colour picker + hex text field; the text keeps its own draft so partial input isn't lost. */
function ColourInput({ index, hex, role, onChange }: { index: number; hex: Hex; role: string; onChange: (h: Hex) => void }) {
  const [draft, setDraft] = useState<string>(hex);
  const [error, setError] = useState(false);
  const id = useId();
  useEffect(() => {
    setDraft(hex);
    setError(false);
  }, [hex]);
  return (
    <div className="grid grid-cols-[3rem_1fr] items-end gap-2">
      <label className="relative block h-11 w-12 cursor-pointer border border-ink" style={{ background: hex }}>
        <span className="sr-only">Pick colour {index + 1} ({role})</span>
        <input type="color" value={hex.toLowerCase()} onChange={(e) => onChange(normaliseHex(e.target.value)!)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0">
        <label htmlFor={id} className="meta mb-1 block text-muted capitalize">
          {index + 1}. {role}
        </label>
        <input
          id={id}
          className="field font-mono uppercase"
          value={draft}
          maxLength={7}
          spellCheck={false}
          aria-invalid={error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const ok = normaliseHex(e.target.value);
            if (ok && e.target.value.replace("#", "").length === 6) {
              setError(false);
              onChange(ok);
            }
          }}
          onBlur={() => {
            const ok = normaliseHex(draft);
            if (ok) {
              onChange(ok);
              setDraft(ok);
              setError(false);
            } else setError(true);
          }}
        />
        {error && (
          <p id={`${id}-err`} className="meta mt-1 text-alert">
            Enter a hex value like #1A2B3C.
          </p>
        )}
      </div>
    </div>
  );
}

// ——— Page ———

const byKind = (Object.keys(kindLabels) as StyleKind[]).map((k) => ({
  kind: k,
  items: styles.filter((s) => s.kind === k).sort((a, b) => a.name.localeCompare(b.name)),
}));

export function Builder() {
  useMeta("Prompt builder", "Compose a detailed image or video prompt from a style, a 2 to 4 colour palette and your subject.");
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [initial] = useState(() => decodeState(new URLSearchParams(location.search)));
  const [state, setState] = useState<BuilderState>(initial.state);
  const [issues, setIssues] = useState<string[]>(initial.issues);
  const lastWritten = useRef<string>(location.search);

  // Manual edit protection
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [basis, setBasis] = useState(""); // generated prompt the edit started from
  const [confirm, setConfirm] = useState<null | "regenerate" | "reset">(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const style = getStyle(state.style) ?? styles[0]!;
  const composed = useMemo(() => composePrompt(state), [state]);
  const palette = resolvePalette(state, style);
  const prompt = edited ? text : composed.prompt;
  const staleEdit = edited && basis !== composed.prompt;

  // Warn before leaving with manual edits: in-app navigation and tab close/reload.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => edited && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!edited) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [edited]);

  // Keep the URL in sync so the address bar is always a share link.
  useEffect(() => {
    const search = `?${encodeState(state).toString()}`;
    if (search !== lastWritten.current) {
      lastWritten.current = search;
      navigate({ pathname: "/builder", search }, { replace: true, preventScrollReset: true });
    }
  }, [state, navigate]);

  // Arriving at /builder with new params from elsewhere (e.g. "Use in builder") restores them.
  useEffect(() => {
    if (location.search !== lastWritten.current) {
      const next = decodeState(new URLSearchParams(location.search));
      lastWritten.current = location.search;
      setState(next.state);
      setIssues(next.issues);
    }
  }, [location.search]);

  const set = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => setState((s) => ({ ...s, [key]: value }));

  /** Swap the untouched default frame (4:5 for image, 16:9 for video); a chosen aspect is kept. */
  const setOutput = (output: Output) =>
    setState((s) => {
      let aspect = s.aspect;
      if (output === "video" && aspect === "4:5") aspect = "16:9";
      if (output === "image" && aspect === "16:9") aspect = "4:5";
      return { ...s, output, aspect };
    });

  const setCount = (n: PaletteSize) =>
    setState((s) => {
      const next = { ...s, count: n };
      if (s.paletteMode === "curated" && getPalette(s.palette)?.colours.length !== n) {
        next.palette = palettes.find((p) => p.colours.length === n)?.slug ?? null;
      }
      return next;
    });

  const setMode = (mode: PaletteMode) =>
    setState((s) => {
      const next = { ...s, paletteMode: mode };
      if (mode === "curated") {
        const current = getPalette(s.palette);
        if (!current || current.colours.length !== s.count) {
          next.palette = palettes.find((p) => p.colours.length === s.count)?.slug ?? palettes[0]!.slug;
        }
        next.count = getPalette(next.palette)!.colours.length as PaletteSize;
      }
      return next;
    });

  const setStyle = (slug: string) =>
    setState((s) => {
      const st = getStyle(slug)!;
      // Custom colours stay yours; only reseed them if you haven't customised.
      const custom = s.paletteMode === "custom" ? s.custom : (st.swatches.map((w) => w.hex) as BuilderState["custom"]);
      return { ...s, style: slug, custom };
    });

  /** Copy the colours currently in use into editable custom slots. Curated entries are never modified. */
  const customise = () =>
    setState((s) => {
      const cols = resolvePalette(s, getStyle(s.style)!).colours.map((c) => c.hex);
      const custom = [...s.custom] as BuilderState["custom"];
      cols.forEach((h, i) => (custom[i] = h));
      return { ...s, paletteMode: "custom", count: cols.length as PaletteSize, custom };
    });

  const setCustom = (i: number, hex: Hex) =>
    setState((s) => {
      const custom = [...s.custom] as BuilderState["custom"];
      custom[i] = hex;
      return { ...s, custom };
    });

  const togglePreserve = (id: PreserveId) =>
    setState((s) => ({ ...s, preserve: s.preserve.includes(id) ? s.preserve.filter((p) => p !== id) : [...s.preserve, id] }));

  const regenerate = () => {
    setEdited(false);
    setText("");
    setConfirm(null);
    toast("Prompt regenerated from your settings");
  };

  const doReset = () => {
    const d = defaultState();
    setState(d);
    setEdited(false);
    setText("");
    setIssues([]);
    setConfirm(null);
    toast("Builder reset");
  };

  const isRestyle = state.task === "restyle";
  const isVideo = state.output === "video";
  const keepColours = isRestyle && state.preserve.includes("colours");
  const keepComposition = isRestyle && state.preserve.includes("composition");
  const keepTiming = isRestyle && isVideo && state.preserve.includes("timing");
  const curatedOfSize = palettes.filter((p) => p.colours.length === state.count);
  const roles = ROLE_ORDER[state.count];

  const filename = `${slugify(site.shortName)}-${style.slug}-${state.output}.txt`;

  return (
    <div className="wrap pt-10 sm:pt-14">
      <header className="grid gap-4 border-b border-ink pb-6 lg:grid-cols-12">
        <h1 className="text-h1 font-bold lg:col-span-7">Prompt builder</h1>
        <p className="max-w-xl self-end text-muted lg:col-span-5">
          Choose a style, colours and framing. The prompt on the right updates as you go and is yours to edit before you copy it.
        </p>
      </header>

      {issues.length > 0 && (
        <div role="alert" className="mt-6 flex items-start gap-3 border border-alert p-4 text-[0.9375rem]">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-alert" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold">Some settings in this link couldn’t be restored.</p>
            <ul className="mt-1 list-disc pl-5 text-muted">
              {issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIssues([])}>
            <X size={14} aria-hidden />
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-10 pt-2 lg:grid-cols-12 lg:gap-12">
        {/* ——— Controls ——— */}
        <form className="lg:col-span-6 xl:col-span-5" onSubmit={(e) => e.preventDefault()} aria-label="Prompt settings">
          <Group legend="Style">
            <label htmlFor="style-select" className="sr-only">
              Style
            </label>
            <select id="style-select" className="field" value={state.style} onChange={(e) => setStyle(e.target.value)}>
              {byKind.map((g) => (
                <optgroup key={g.kind} label={kindLabels[g.kind]}>
                  {g.items.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-2 text-sm text-muted">
              {style.summary}{" "}
              <Link to={`/styles/${style.slug}`} className="underline underline-offset-2">
                View style
              </Link>
            </p>
          </Group>

          <div className="grid gap-x-6 sm:grid-cols-2">
            <Group legend="Output">
              <Segmented<Output> name="output" value={state.output} onChange={setOutput} options={[{ id: "image", label: "Image" }, { id: "video", label: "Video" }]} />
            </Group>
            <Group legend="Task">
              <Segmented<Task> name="task" value={state.task} onChange={(v) => set("task", v)} options={[{ id: "create", label: "Create new" }, { id: "restyle", label: "Restyle existing" }]} />
            </Group>
          </div>

          <Group legend={isRestyle ? "What’s in your source? (optional)" : "Subject"} hint={`${state.subject.length}/${SUBJECT_MAX} characters`}>
            <label htmlFor="subject" className="sr-only">
              Subject
            </label>
            <textarea
              id="subject"
              className="field min-h-24 resize-y"
              maxLength={SUBJECT_MAX}
              placeholder={isRestyle ? "e.g. a portrait of my grandmother in her garden…" : "e.g. a lighthouse keeper reading by a window at dusk…"}
              autoComplete="off"
              name="subject"
              value={state.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </Group>

          <Group legend="Style intensity">
            <Segmented<Intensity>
              name="intensity"
              value={state.intensity}
              onChange={(v) => set("intensity", v)}
              options={[
                { id: "subtle", label: "Subtle" },
                { id: "balanced", label: "Balanced" },
                { id: "strong", label: "Strong" },
              ]}
            />
            <p className="meta mt-2 text-muted">
              {state.intensity === "subtle" ? "Two defining cues; the subject stays natural." : state.intensity === "balanced" ? "Four cues plus texture." : "Every cue, texture and material."}
            </p>
          </Group>

          <Group legend="Palette" id="palette-group">
            {keepColours ? (
              <p className="border-l-2 border-ink pl-3 text-sm text-muted">
                You’re preserving the source’s original colours, so no palette is added to the prompt. Untick “Original colours” below to use one.
              </p>
            ) : (
              <>
                <Segmented<PaletteMode>
                  name="paletteMode"
                  value={state.paletteMode}
                  onChange={setMode}
                  options={[
                    { id: "style", label: "Style default" },
                    { id: "curated", label: "Curated" },
                    { id: "custom", label: "Custom" },
                  ]}
                />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="meta text-muted" id="count-label">
                    Number of colours
                  </span>
                  <div role="group" aria-labelledby="count-label">
                    <Segmented<PaletteSize>
                      name="count"
                      value={state.count}
                      onChange={setCount}
                      options={[
                        { id: 2, label: "2" },
                        { id: 3, label: "3" },
                        { id: 4, label: "4" },
                      ]}
                    />
                  </div>
                </div>

                {state.paletteMode === "curated" && (
                  <div className="mt-4">
                    <Select
                      label={`Curated ${state.count}-colour palettes`}
                      value={state.palette ?? ""}
                      onChange={(v) => set("palette", v)}
                      options={curatedOfSize.map((p) => ({ id: p.slug, label: `${p.name} (${p.mood.toLowerCase()})` }))}
                    />
                  </div>
                )}

                {state.paletteMode === "custom" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {roles.map((role, i) => (
                      <ColourInput key={i} index={i} role={role} hex={state.custom[i]!} onChange={(h) => setCustom(i, h)} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <ul className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${palette.colours.length}, minmax(0,1fr))` }}>
                      {palette.colours.map((c) => (
                        <li key={c.hex + c.role} className="flex min-h-16 flex-col justify-end border border-black/10 p-1.5" style={{ background: c.hex, color: inkOn(c.hex) }}>
                          <span className="meta capitalize">{c.role}</span>
                          <span className="meta">{c.hex}</span>
                        </li>
                      ))}
                    </ul>
                    <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={customise}>
                      Edit these colours
                    </button>
                    <span className="meta ml-2 text-muted">Creates a custom copy{state.paletteMode === "curated" ? "; the curated palette is unchanged" : ""}.</span>
                  </div>
                )}
              </>
            )}
          </Group>

          <Group legend="Composition">
            {keepComposition ? (
              <p className="border-l-2 border-ink pl-3 text-sm text-muted">Composition and aspect ratio are preserved from your source.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Framing" value={state.composition} options={compositionOptions} onChange={(v) => set("composition", v)} />
                <Select label="Aspect ratio" value={state.aspect} options={aspectOptions} onChange={(v) => set("aspect", v)} />
              </div>
            )}
          </Group>

          <Group legend="Lighting (optional)">
            <Select label="Lighting" value={state.lighting} options={lightingOptions} onChange={(v) => set("lighting", v)} />
            {state.lighting === "style" && <p className="meta mt-2 text-muted">Style default: {style.look.lighting}.</p>}
          </Group>

          {isRestyle && (
            <Group legend="Features to preserve" hint="Preservation is an instruction to the model, not a guarantee.">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {preserveOptions
                  .filter((o) => isVideo || !o.videoOnly)
                  .map((o) => {
                    const on = state.preserve.includes(o.id);
                    return (
                      <label key={o.id} className={`flex min-h-10 cursor-pointer items-center gap-2 border px-3 text-sm ${on ? "border-ink bg-ink text-paper" : "border-rule-strong"}`}>
                        <input type="checkbox" checked={on} onChange={() => togglePreserve(o.id)} className="h-4 w-4 accent-[#DFFF70]" />
                        {o.label}
                      </label>
                    );
                  })}
              </div>
            </Group>
          )}

          {isVideo && (
            <Group legend="Motion">
              {keepTiming ? (
                <p className="border-l-2 border-ink pl-3 text-sm text-muted">Camera and subject motion follow your source clip.</p>
              ) : (
                <div className="space-y-4">
                  {!isRestyle && (
                    <div>
                      <span className="meta mb-1.5 block text-muted" id="dur-label">
                        Duration
                      </span>
                      <div role="group" aria-labelledby="dur-label">
                        <Segmented name="duration" value={state.duration} onChange={(v) => set("duration", v)} options={durationOptions.map((d) => ({ id: d.id, label: d.label }))} />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select label="Camera movement" value={state.camera} options={cameraOptions} onChange={(v) => set("camera", v)} />
                    <Select label="Subject movement" value={state.movement} options={movementOptions} onChange={(v) => set("movement", v)} />
                  </div>
                </div>
              )}
            </Group>
          )}
        </form>

        {/* ——— Output ——— */}
        <section className="lg:col-span-6 xl:col-span-7" aria-labelledby="output-title">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-start gap-4 border-t border-rule pt-5">
              <div className="w-24 shrink-0 sm:w-28">
                <StyleArt style={style} colours={keepColours ? undefined : palette.colours.map((c) => c.hex)} eager label={false} />
              </div>
              <div className="min-w-0">
                <h2 id="output-title" className="text-2xl font-semibold tracking-[-0.02em]">
                  {state.output === "video" ? "Video" : "Image"} prompt
                </h2>
                <p className="meta mt-1 text-muted">
                  {style.name}, {state.task === "restyle" ? "restyling a source" : "new"}, {state.intensity} intensity.
                  <br />
                  Colours: {keepColours ? "original colours" : palette.label}.
                </p>
                <p className="meta mt-1 text-muted">Preview: the style study{keepColours ? "" : " recoloured with your palette"}.</p>
              </div>
            </div>

            {staleEdit && (
              <div role="status" className="mt-4 flex flex-wrap items-center gap-3 border border-ink bg-acid/40 p-3 text-sm">
                <p className="flex-1">Settings changed since you edited the prompt. Your edits are kept until you choose to regenerate.</p>
                <button type="button" className="btn btn-ghost btn-sm bg-paper" onClick={() => setConfirm("regenerate")}>
                  <RefreshCw size={14} aria-hidden />
                  Regenerate
                </button>
              </div>
            )}

            <label htmlFor="prompt" className="sr-only">
              Prompt (editable)
            </label>
            <textarea
              id="prompt"
              ref={textRef}
              value={prompt}
              onChange={(e) => {
                if (!edited) setBasis(composed.prompt);
                setText(e.target.value);
                setEdited(true);
              }}
              spellCheck
              className="mt-4 min-h-[22rem] w-full resize-y border border-ink bg-[#fbfaf7] p-4 font-mono text-[0.8125rem] leading-relaxed"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="meta text-muted">{edited ? "Edited by you. Settings changes won’t overwrite it." : "Generated from your settings. Type to edit."}</p>
              {edited && !staleEdit && (
                <button type="button" className="meta underline underline-offset-2" onClick={() => setConfirm("regenerate")}>
                  Discard edits and regenerate
                </button>
              )}
            </div>

            {composed.notes.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {composed.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span aria-hidden>-</span>
                    {n}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <CopyButton
                text={prompt}
                what="prompt"
                variant="primary"
                onFail={() => {
                  textRef.current?.focus();
                  textRef.current?.select();
                }}
              >
                Copy prompt
              </CopyButton>
              <button type="button" className="btn btn-ghost" onClick={() => {
                downloadText(filename, prompt + "\n");
                toast(`Downloaded ${filename}`);
              }}>
                <Download size={16} aria-hidden />
                Download .txt
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={async () => {
                  const url = `${window.location.origin}/builder?${encodeState(state).toString()}`;
                  const ok = await copyText(url);
                  toast(
                    ok ? (edited ? "Copied share link. It restores settings, not your manual edits" : "Copied share link") : "Couldn’t copy the link. Copy it from the address bar instead.",
                    ok ? "ok" : "error",
                  );
                }}
              >
                <Link2 size={16} aria-hidden />
                Copy share link
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm("reset")}>
                <RotateCcw size={16} aria-hidden />
                Reset
              </button>
            </div>

            <div className="mt-6 space-y-2 border-t border-rule pt-4 text-sm text-muted">
              <p>
                <strong className="font-semibold text-ink">About hex values.</strong> They state colour intent. Image and video tools interpret them
                loosely and may not reproduce them exactly.
              </p>
              <p>
                <strong className="font-semibold text-ink">About preservation.</strong> “Preserve” lines are instructions, not guarantees. Check faces, text
                and logos in the result.
              </p>
              <p>This tool writes prompts only. Paste the prompt into the image or video tool of your choice.</p>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirm === "regenerate"}
        title="Replace your edited prompt?"
        body="Your manual edits will be discarded and the prompt rebuilt from the current settings."
        confirmLabel="Replace prompt"
        onConfirm={regenerate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "reset"}
        title="Reset the builder?"
        body={edited ? "All settings return to their defaults and your edited prompt will be discarded." : "All settings return to their defaults."}
        confirmLabel="Reset builder"
        onConfirm={doReset}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Leave with unsaved edits?"
        body="Your manually edited prompt isn’t saved anywhere. Copy or download it first if you want to keep it."
        confirmLabel="Leave and discard"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}
