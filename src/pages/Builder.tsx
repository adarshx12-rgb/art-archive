import { AlertTriangle, Download, Eraser, ImagePlus, Link2, PersonStanding, MessageSquarePlus, Plus, RefreshCw, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate } from "react-router";
import { Storyboard } from "../art/Storyboard";

import { CopyButton } from "../components/actions";
import { CommentLayer } from "../components/CommentLayer";
import { ConceptCards } from "../components/ConceptCards";
import { EraseLayer } from "../components/EraseLayer";
import { ImageCropper } from "../components/ImageCropper";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PresetBar } from "../components/PresetBar";
import { SubjectLayers } from "../components/SubjectLayers";
import { TransformPanel } from "../components/TransformPanel";
import { site } from "../config/site";
import { kindLabels } from "../content/facets";
import { palettes, getPalette } from "../content/palettes";
import { getStyle, styles } from "../content/styles";
import { formatInfo, TEMPLATE_FORMATS } from "../content/templates";
import type { Hex, PaletteSize, StyleKind, TemplateFormat } from "../content/types";
import { aiConcepts, aiPrompt, aiScene, aiSchemes, type Concept } from "../lib/ai";
import { copyText, downloadText, slugify } from "../lib/clipboard";
import { inkOn, normaliseHex } from "../lib/color";
import { composePrompt, joinList, resolvePalette, ROLE_ORDER } from "../lib/prompt/compose";
import {
  aspectOptions,
  preserveOptions,
  type Intensity,
  type PaletteMode,
  type PreserveId,
  type Task,
} from "../lib/prompt/options";
import { decodeState, defaultState, encodeState, SUBJECT_MAX, TEXT_MAX, type BuilderState, type Comment as Note } from "../lib/prompt/state";
import { aspectOf, byPriority, projectScene, shotCamera } from "../lib/scene/camera";
import { subjectAt } from "../lib/scene/describe";
import { applyLayerEdit, placeInFrame } from "../lib/scene/convert";
import { fillText, needsLayout } from "../lib/scene/instruction";
import { actorFromText, FIGURES, imageActor, MAX_ACTORS, MAX_IMAGES, newActor, textActor, type Actor } from "../lib/scene/model";
import { newImageKey, saveImage, useImages } from "../lib/images";
import type { Layer } from "../lib/sketch/layers";
import { AI_DRAWN } from "../lib/sketch/drawing";
import { useDrawings } from "../lib/sketch/useDrawings";
import { useMeta } from "../lib/useMeta";
import { ThemeToggle } from "../state/theme";
import { useToast } from "../state/toast";

// ——— Small form primitives ———

function Group({ legend, children, hint, id }: { legend: string; children: React.ReactNode; hint?: React.ReactNode; id?: string }) {
  return (
    <fieldset className="min-w-0 border-t border-rule py-5" id={id}>
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

/** The builder makes image prompts from scratch for now: video links open as images, and older links lose their layout template. */
function imageOnly(decoded: ReturnType<typeof decodeState>): ReturnType<typeof decodeState> {
  const r = { ...decoded, state: { ...decoded.state, template: null, templateText: {} } };
  if (r.state.output !== "video") return r;
  const aspect = r.state.aspect === "16:9" ? "4:5" : r.state.aspect;
  return {
    state: { ...r.state, output: "image", aspect, preserve: r.state.preserve.filter((p) => p !== "timing") },
    issues: [...r.issues, "The builder makes image prompts for now, so this video link opened as an image prompt."],
  };
}

export function Builder() {
  useMeta("Prompt builder", "Compose a detailed image prompt from a style, a 2 to 4 colour palette, your subject and a rough sketch of the layout.");
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [initial] = useState(() => imageOnly(decodeState(new URLSearchParams(location.search))));
  const [state, setState] = useState<BuilderState>(initial.state);
  const [issues, setIssues] = useState<string[]>(initial.issues);
  const lastWritten = useRef<string>(location.search);

  // Manual edit protection
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [basis, setBasis] = useState(""); // generated prompt the edit started from
  const [confirm, setConfirm] = useState<null | "regenerate" | "reset">(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const letteringRef = useRef<HTMLInputElement>(null);
  // The transform panel sits in the empty space left of the preview when it fits.
  const stageRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<{ width: number; board: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const board = boardRef.current;
    if (!stage || !board) return;
    const measure = () => {
      const free = (stage.clientWidth - board.offsetWidth) / 2 - 16;
      setSide(free >= 208 ? { width: Math.min(free, 288), board: board.offsetWidth, height: board.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(board);
    return () => ro.disconnect();
  }, []);

  const style = getStyle(state.style) ?? styles[0]!;
  const composed = useMemo(() => composePrompt(state), [state]);
  const palette = resolvePalette(state, style);
  // A 1-colour palette is the background only; the sketch fills the other roles with the style's colours.
  const sketchColours = palette.colours.length === 1 ? [palette.colours[0]!, ...resolvePalette({ ...state, paletteMode: "style", count: 4 }, style).colours.slice(1)] : palette.colours;
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
    if (search === lastWritten.current) return;
    const t = window.setTimeout(() => {
      lastWritten.current = search;
      navigate({ pathname: "/builder", search }, { replace: true, preventScrollReset: true });
    }, 250);
    return () => window.clearTimeout(t);
  }, [state, navigate]);

  // Arriving at /builder with new params from elsewhere (e.g. "Use in builder") restores them.
  useEffect(() => {
    if (location.search !== lastWritten.current) {
      const next = imageOnly(decodeState(new URLSearchParams(location.search)));
      lastWritten.current = location.search;
      setState(next.state);
      setIssues(next.issues);
    }
  }, [location.search]);

  // The subject box grows with its text instead of leaving empty lines. Browsers with
  // CSS field-sizing do this natively; elsewhere, match the height to the content.
  useLayoutEffect(() => {
    const el = subjectRef.current;
    if (!el || CSS.supports?.("field-sizing", "content")) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [state.subject]);

  const set = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => setState((s) => ({ ...s, [key]: value }));

  const setCount = (n: PaletteSize) =>
    setState((s) => {
      const next = { ...s, count: n };
      // No curated palette has one colour: keep the current background as a custom one.
      if (n === 1 && s.paletteMode === "curated") {
        const bg = resolvePalette(s, getStyle(s.style)!).colours[0]!.hex;
        return { ...next, paletteMode: "custom", custom: [bg, s.custom[1], s.custom[2], s.custom[3]] };
      }
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

  /** A poster, thumbnail…: the frame takes the format's shape. */
  const chooseFormat = (format: TemplateFormat | null) => setState((s) => ({ ...s, format, ...(format ? { aspect: formatInfo(format).aspect } : {}) }));

  /** Copy the colours currently in use into editable custom slots. Curated entries are never modified. */
  const customise = () =>
    setState((s) => {
      const cols = resolvePalette(s, getStyle(s.style)!).colours.map((c) => c.hex);
      const custom = [...s.custom] as BuilderState["custom"];
      cols.forEach((h, i) => (custom[i] = h));
      return { ...s, paletteMode: "custom", count: cols.length as PaletteSize, custom };
    });

  /** Use these exact colours (a suggestion that isn't a curated palette). */
  const setColours = (hexes: Hex[]) =>
    setState((s) => {
      const custom = [...s.custom] as BuilderState["custom"];
      hexes.forEach((h, i) => (custom[i] = h));
      return { ...s, paletteMode: "custom", count: hexes.length as PaletteSize, custom };
    });

  const setCurated = (slug: string) =>
    setState((s) => ({ ...s, paletteMode: "curated", palette: slug, count: getPalette(slug)!.colours.length as PaletteSize }));

  /** Switch to editable colours and bring the palette controls into view. */
  const editCustom = () => {
    customise();
    requestAnimationFrame(() => document.getElementById("palette-group")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const setCustom = (i: number, hex: Hex) =>
    setState((s) => {
      const custom = [...s.custom] as BuilderState["custom"];
      custom[i] = hex;
      return { ...s, custom };
    });

  // Subjects in the 3D scene
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** The comment tool: while it's on, clicks on the preview place, open and move comments. */
  const [tool, setTool] = useState<"erase" | "comment" | "puppet" | null>(null);
  const commenting = tool === "comment";
  useEffect(() => {
    if (!tool) return;
    const off = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) setTool(null);
    };
    window.addEventListener("keydown", off);
    return () => window.removeEventListener("keydown", off);
  }, [tool]);

  /** What a plain drag on the 3D view's background does. */
  const [viewTool, setViewTool] = useState<"orbit" | "pan">("orbit");
  const setActors = (fn: (actors: Actor[]) => Actor[]) => setState((s) => ({ ...s, actors: fn(s.actors) }));
  /** New subjects land in a free spot of the current frame. */
  const framed = (a: Actor) => placeInFrame(shotCamera(state), a, state.actors.length);
  /** Put the typed words in the scene as one subject and clear the box for the next one. */
  const placeDraft = (words: string) => {
    const raw = actorFromText(words, state.actors);
    if (!raw) return;
    setState((s) => (s.actors.length >= MAX_ACTORS ? s : { ...s, subject: "", actors: [...s.actors, placeInFrame(shotCamera(s), raw, s.actors.length)] }));
    setSelectedId(raw.id);
  };
  /** ADD: a plain subject is placed at once; a described layout ("add {text} on a cloud with cows below") is worked out by the server. */
  const addDraft = async () => {
    if (aiBusy || state.actors.length >= MAX_ACTORS || !state.subject.trim()) return;
    const words = state.subject;
    if (!needsLayout(words)) {
      placeDraft(words);
      subjectRef.current?.focus();
      return;
    }
    const filled = fillText(words, state.text);
    if (filled.missing) {
      toast("{text} stands for the words under “Text in the image”. Type them there first.", "error");
      letteringRef.current?.focus();
      return;
    }
    const ok = await runScene(state.actors.length ? "edit" : "new", filled.request, { clearDraft: true, clearText: filled.used, quiet: true });
    if (!ok) {
      placeDraft(words);
      toast("Couldn’t lay that out, so it was added as one subject.");
    }
    subjectRef.current?.focus();
  };
  /** Put the typed text on the sketch, where it can be moved and sized, and clear the box. */
  // ——— Added pictures ———
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const imageCount = state.actors.filter((a) => a.glyph === "image").length;
  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast("Choose a JPG, PNG or WebP image.", "error");
    if (file.size > 10 * 1024 * 1024) return toast("That image is over 10 MB. Choose a smaller one.", "error");
    setCropping(file);
  };
  const addImage = async (dataUrl: string, ratio: number) => {
    setCropping(null);
    if (imageCount >= MAX_IMAGES || state.actors.length >= MAX_ACTORS) return;
    const key = newImageKey();
    const kept = await saveImage(key, dataUrl);
    if (!kept) toast("This browser won’t store images, so this one lasts until you close the page.", "error");
    const actor = framed(imageActor({ key, ratio }, state.actors));
    setState((s) => ({ ...s, actors: [...s.actors, actor] }));
    setTool(null);
    setSelectedId(actor.id);
  };

  const addText = () => {
    const raw = textActor(state.text, state.actors);
    if (!raw || state.actors.length >= MAX_ACTORS) return;
    const actor = framed(raw);
    setState((s) => ({ ...s, text: "", actors: [...s.actors, actor] }));
    setSelectedId(actor.id);
    letteringRef.current?.focus();
  };
  const transformPanel = (a: Actor, vertical: boolean) => (
    <TransformPanel
      flat={state.view === "2d"}
      vertical={vertical}
      actor={a}
      onChange={(patch) => updateActor(a.id, patch)}
      onDelete={() => deleteActor(a.id)}
      onDuplicate={() => duplicateActor(a.id)}
      onClose={() => setSelectedId(null)}
    />
  );
  const updateActor = (id: string, patch: Partial<Actor>) => setActors((as) => as.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const deleteActor = (id: string) => {
    setActors((as) => as.filter((a) => a.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };
  const duplicateActor = (id: string) => {
    const src = state.actors.find((a) => a.id === id);
    if (!src || state.actors.length >= MAX_ACTORS) return;
    const copy: Actor = { ...src, id: newActor(src.glyph, src.label, state.actors).id, position: [src.position[0] + 0.8, src.position[1], src.position[2]] };
    setActors((as) => [...as, copy]);
    setSelectedId(copy.id);
  };
  const selectedActor = state.actors.find((a) => a.id === selectedId) ?? null;

  // ——— AI (server side; see worker/) ———
  const [aiBusy, setAiBusy] = useState<null | "scene" | "prompt" | "concepts">(null);
  const [aiNote, setAiNote] = useState<{ text: string; undo?: () => void } | null>(null);
  const [promptWarnings, setPromptWarnings] = useState<string[]>([]);
  // Design ideas: three concepts, the titles shown so far, the prompt they were made for, and the one picked.
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [shownTitles, setShownTitles] = useState<string[]>([]);
  const [conceptsBasis, setConceptsBasis] = useState("");
  const [chosenConcept, setChosenConcept] = useState<string | null>(null);

  const getIdeas = async (more: boolean) => {
    setAiBusy("concepts");
    const res = await aiConcepts(state, more ? shownTitles : []);
    setAiBusy(null);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }
    const titles = res.data.concepts.map((c) => c.title);
    setConcepts(res.data.concepts);
    setShownTitles(more ? [...shownTitles, ...titles].slice(-12) : titles);
    setConceptsBasis(composed.prompt);
    setChosenConcept(null);
  };

  const applyConcept = async (concept: Concept) => {
    setAiBusy("prompt");
    const { tags: _tags, ...brief } = concept;
    const res = await aiPrompt(state, brief);
    setAiBusy(null);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }
    setBasis(composed.prompt);
    setText(res.data.prompt);
    setEdited(true);
    setPromptWarnings(res.data.warnings);
    setChosenConcept(concept.title);
    toast(res.data.warnings.length ? "Prompt written. Check the notes below it." : `Prompt written for “${concept.title}”`);
  };
  /**
   * Lay out, change or re-sync the scene on the server. The previous scene can be restored.
   * clearDraft / clearText empty the boxes whose words were used; quiet leaves failures to the caller.
   */
  const runScene = async (mode: "new" | "edit" | "from-prompt", text: string, opts: { clearDraft?: boolean; clearText?: boolean; quiet?: boolean } = {}) => {
    setAiBusy("scene");
    const before = { actors: state.actors, shot: state.shot, angle: state.angle, lens: state.lens, composition: state.composition, lighting: state.lighting };
    const res = await aiScene(state, shotCamera(state), mode, text);
    setAiBusy(null);
    if (!res.ok) {
      if (!opts.quiet) toast(res.error, "error");
      return false;
    }
    const { camera: cam, lighting } = res.data;
    // The AI can move added pictures but never makes them: give kept ones back their kind, label and picture.
    const pictures = new Map(state.actors.filter((a) => a.image).map((a) => [a.id, a]));
    // A puppet pose stays unless the AI gave the figure a different pose.
    const posed = new Map(state.actors.filter((a) => a.rig).map((a) => [a.id, a]));
    const actors = res.data.actors.map((a) => {
      const was = pictures.get(a.id);
      if (was) return { ...a, glyph: was.glyph, label: was.label, image: was.image, count: 1 };
      const figure = posed.get(a.id);
      return figure && figure.pose === a.pose && FIGURES.has(a.glyph) ? { ...a, rig: figure.rig } : a;
    });
    setState((s) => ({
      ...s,
      actors,
      shot: cam.shot,
      angle: cam.angle,
      lens: cam.lens,
      composition: cam.placement,
      lighting,
      subject: opts.clearDraft ? "" : s.subject,
      text: opts.clearText ? "" : s.text,
    }));
    setSelectedId(null);
    setAiNote({ text: res.data.reply, undo: () => setState((s) => ({ ...s, ...before })) });
    return true;
  };

  // The flat sketch is the scene seen through the shot camera.
  const camera = shotCamera(state);
  const projected = projectScene(camera, state.actors);

  // ——— Eraser ———
  /** What one press of the eraser has removed so far, so it can be undone in one go. */
  const sweep = useRef<{ actors: { actor: Actor; index: number }[]; comments: { comment: Note; index: number }[] }>({ actors: [], comments: [] });
  const eraseAt = (x: number, y: number, size: { width: number; height: number }) => {
    const gone = sweep.current;
    // Comment dots first: they sit on top. Within about 14px of the dot.
    const dot = state.comments.find((c) => Math.hypot((c.x - x) * size.width, (c.y - y) * size.height) < 14 && !gone.comments.some((g) => g.comment.id === c.id));
    if (dot) {
      gone.comments.push({ comment: dot, index: state.comments.indexOf(dot) });
      setState((s) => ({ ...s, comments: s.comments.filter((c) => c.id !== dot.id) }));
      return;
    }
    const hit = subjectAt(x, y, projected.filter((p) => !gone.actors.some((g) => g.actor.id === p.actor.id)), aspectOf(state.aspect));
    if (!hit) return;
    gone.actors.push({ actor: hit.actor, index: state.actors.findIndex((a) => a.id === hit.actor.id) });
    deleteActor(hit.actor.id);
  };
  const endSweep = () => {
    const { actors, comments } = sweep.current;
    sweep.current = { actors: [], comments: [] };
    if (!actors.length && !comments.length) return;
    const names = [...actors.map((g) => (g.actor.glyph === "text" ? `“${g.actor.label}”` : g.actor.glyph === "image" ? g.actor.label : `the ${g.actor.label.replace(/^(a|an|the|one)\s+/i, "")}`)), ...comments.map((g) => `comment ${g.index + 1}`)];
    // Put things back where they were in the lists, so numbering and nearest-first order return too.
    const putBack = <T,>(list: T[], items: { item: T; index: number }[]) => {
      const out = [...list];
      [...items].sort((a, b) => a.index - b.index).forEach(({ item, index }) => out.splice(Math.min(index, out.length), 0, item));
      return out;
    };
    setAiNote({
      text: `Erased ${joinList(names)}.`,
      undo: () =>
        setState((s) => ({
          ...s,
          actors: putBack(s.actors, actors.map((g) => ({ item: g.actor, index: g.index }))),
          comments: putBack(s.comments, comments.map((g) => ({ item: g.comment, index: g.index }))),
        })),
    });
  };
  // Subjects with no built-in shape get an AI line drawing once it arrives.
  const images = useImages(state.actors.flatMap((a) => (a.image ? [a.image.key] : [])));
  const drawings = useDrawings(state.actors.filter((a) => AI_DRAWN.has(a.glyph)).map((a) => a.label));
  const orbited = Boolean(state.orbit.yaw || state.orbit.tilt || state.orbit.panX || state.orbit.panY);
  /** Dragging the 3D view: turn around the set, or slide the camera. */
  const lookAround = (kind: "orbit" | "pan", dx: number, dy: number) =>
    setState((s) => {
      const o = s.orbit;
      if (kind === "orbit") return { ...s, orbit: { ...o, yaw: Math.round((o.yaw - dx * 180) * 10) / 10, tilt: Math.round(Math.min(Math.max(o.tilt + dy * 90, -60), 90) * 10) / 10 } };
      const cam = shotCamera(s);
      return { ...s, orbit: { ...o, panX: Math.round((o.panX - dx * cam.cover * cam.aspect) * 100) / 100, panY: Math.round(Math.max(o.panY + dy * cam.cover, -5) * 100) / 100 } };
    });
  const priority = byPriority(projected);
  /** An edit on the flat sketch, applied to the 3D subject. */
  const editFromSketch = (id: string, patch: Partial<Layer>) => {
    const a = state.actors.find((x) => x.id === id);
    if (a) updateActor(id, applyLayerEdit(camera, a, patch));
  };

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
    setSelectedId(null);
    setConfirm(null);
    toast("Builder reset");
  };

  const isRestyle = state.task === "restyle";
  const isVideo = state.output === "video";
  const keepColours = isRestyle && state.preserve.includes("colours");
  const keepComposition = isRestyle && state.preserve.includes("composition");
  const curatedOfSize = palettes.filter((p) => p.colours.length === state.count);
  const roles = ROLE_ORDER[state.count];

  const filename = `${slugify(site.shortName)}-${style.slug}-${state.output}.txt`;

  const [aw, ah] = state.aspect.split(":").map(Number) as [number, number];

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#output-title" className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50">
        Skip to the prompt
      </a>
      <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-rule bg-paper/95 px-4 backdrop-blur-[2px] sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link to="/" className="font-extrabold tracking-[-0.03em] whitespace-nowrap" aria-label={`${site.name} home`}>
            {site.name}
          </Link>
          <span className="text-muted" aria-hidden>
            /
          </span>
          <h1 className="truncate text-[0.9375rem] font-semibold">Prompt builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/styles" className="btn btn-ghost btn-sm">
            Styles
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
        {/* ——— Controls ——— */}
        <form
          className="order-2 border-rule px-4 pb-10 sm:px-6 lg:relative lg:order-none lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:border-r"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Prompt settings"
        >
          <Group legend="Style">
            <label htmlFor="style-select" className="sr-only">
              Style
            </label>
            <div className="flex gap-2">
              <select id="style-select" className="field min-w-0 flex-1" value={state.style} onChange={(e) => setStyle(e.target.value)}>
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
              {!isRestyle && (
                <>
                  <label htmlFor="format-select" className="sr-only">
                    Format
                  </label>
                  <select id="format-select" className="field w-auto shrink-0" value={state.format ?? ""} onChange={(e) => chooseFormat((e.target.value || null) as TemplateFormat | null)}>
                    <option value="">Any format</option>
                    {TEMPLATE_FORMATS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">
              {style.summary}{" "}
              <Link to={`/styles/${style.slug}`} className="underline underline-offset-2">
                View style
              </Link>
            </p>
          </Group>

          <Group legend="Task">
            <Segmented<Task> name="task" value={state.task} onChange={(v) => set("task", v)} options={[{ id: "create", label: "Create new image" }, { id: "restyle", label: "Restyle an image" }]} />
          </Group>

          <Group legend={isRestyle ? "What’s in your source? (optional)" : "Subject"} hint={`${state.subject.length}/${SUBJECT_MAX} characters`}>
            <label htmlFor="subject" className="sr-only">
              Subject
            </label>
            <textarea
              id="subject"
              ref={subjectRef}
              rows={1}
              className="field resize-none overflow-hidden"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              maxLength={SUBJECT_MAX}
              placeholder={isRestyle ? "e.g. my grandmother in her garden…" : "e.g. an old fisherman in a yellow coat"}
              autoComplete="off"
              name="subject"
              value={state.subject}
              readOnly={aiBusy === "scene"}
              onChange={(e) => set("subject", e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the subject to the sketch; Shift+Enter keeps a new line.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void addDraft();
                }
              }}
            />
            <SubjectLayers
              draft={state.subject}
              subjects={[...priority, ...state.actors.filter((a) => !projected.some((p) => p.id === a.id))].map((a) => ({ id: a.id, label: a.label, text: a.glyph === "text" }))}
              selectedId={selectedId}
              onAddDraft={addDraft}
              onSelect={setSelectedId}
              onRename={(id, label) => updateActor(id, { label: label.slice(0, 80) })}
              onDelete={deleteActor}
              busy={aiBusy === "scene"}
            />
          </Group>

          <Group legend={isRestyle ? "New text (optional)" : "Text in the image (optional)"} hint={state.text ? `${state.text.length}/${TEXT_MAX} characters. Spelled exactly as typed; + places it on the sketch.` : "A title, sign or slogan to letter in the style’s type. + places it on the sketch."}>
            <label htmlFor="text" className="sr-only">
              Text in the image
            </label>
            <div className="flex gap-2">
              <input
                id="text"
                ref={letteringRef}
                className="field min-w-0 flex-1"
                maxLength={TEXT_MAX}
                placeholder={isRestyle ? "e.g. OPEN LATE" : "e.g. NEON RUSH"}
                autoComplete="off"
                name="text"
                value={state.text}
                onChange={(e) => set("text", e.target.value)}
                onKeyDown={(e) => {
                  // Enter places the text on the sketch, like ADD for subjects.
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addText();
                  }
                }}
              />
              <button type="button" className="btn btn-primary shrink-0 px-3" disabled={!state.text.trim() || state.actors.length >= MAX_ACTORS} onClick={addText} aria-label="Place the text on the sketch" title="Place the text on the sketch">
                <Plus size={16} aria-hidden />
              </button>
            </div>
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
                        { id: 1, label: "1" },
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
                        <li key={c.hex + c.role} className="flex min-h-16 flex-col justify-end border border-swatch-edge p-1.5" style={{ background: c.hex, color: inkOn(c.hex) }}>
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

          <Group legend="Frame" hint="Camera, lighting, film setup and quick palettes are in the bar under the sketch.">
            {keepComposition ? (
              <p className="border-l-2 border-ink pl-3 text-sm text-muted">Composition and aspect ratio are preserved from your source.</p>
            ) : (
              <Select
                label="Aspect ratio"
                value={state.aspect}
                options={aspectOptions}
                // A different shape no longer fits the chosen format.
                onChange={(v) => setState((s) => ({ ...s, aspect: v, format: s.format && formatInfo(s.format).aspect !== v ? null : s.format }))}
              />
            )}
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

        </form>

        {/* ——— Sketch and prompt ——— */}
        <main className="order-1 min-w-0 px-4 py-6 sm:px-6 lg:relative lg:order-none lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto">
      {issues.length > 0 && (
        <div role="alert" className="mb-6 flex items-start gap-3 border border-alert p-4 text-[0.9375rem]">
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

          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="seg" role="radiogroup" aria-label="Preview">
                {(
                  [
                    ["3d", "3D view"],
                    ["2d", "2D board"],
                  ] as const
                ).map(([v, label]) => (
                  <label key={v}>
                    <input type="radio" name="view" checked={state.view === v} onChange={() => set("view", v)} />
                    {state.view === v && <span aria-hidden>✓</span>}
                    {label}
                  </label>
                ))}
              </div>
              {state.view === "3d" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="seg" role="radiogroup" aria-label="Drag to">
                    {(
                      [
                        ["orbit", "Rotate"],
                        ["pan", "Pan"],
                      ] as const
                    ).map(([t, label]) => (
                      <label key={t}>
                        <input type="radio" name="viewTool" checked={viewTool === t} onChange={() => setViewTool(t)} />
                        {viewTool === t && <span aria-hidden>✓</span>}
                        {label}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!orbited} onClick={() => set("orbit", { yaw: 0, tilt: 0, panX: 0, panY: 0 })}>
                    <RotateCcw size={14} aria-hidden />
                    Reset view
                  </button>
                </div>
              )}
            </div>
            <div ref={stageRef} className="relative">
            <div ref={boardRef} className="relative mx-auto" style={{ maxWidth: `calc(58dvh * ${aw} / ${ah})` }}>
              {/* Tools: a slim bar on the board's right edge (inside its corner on small screens) */}
              <div role="toolbar" aria-label="Preview tools" aria-orientation="vertical" className="absolute top-2 right-2 z-10 flex flex-col gap-1 rounded-2xl border border-rule bg-paper p-1.5 shadow-sm sm:top-0 sm:right-auto sm:left-full sm:ml-2">
                {(
                  [
                    ["puppet", "Puppet", "click a person, then drag the pins on its joints to pose it", PersonStanding],
                    ["erase", "Erase", "click or drag over subjects and comments to remove them", Eraser],
                    ["comment", "Comment", "click the preview to pin a note", MessageSquarePlus],
                  ] as const
                ).map(([id, name, how, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={tool === id}
                    title={tool === id ? `${name} on (Esc to leave)` : `${name}: ${how}`}
                    className={`flex size-9 items-center justify-center rounded-xl transition-colors ${tool === id ? "bg-ink text-paper" : "text-ink hover:bg-rule"}`}
                    onClick={() => {
                      setTool((t) => (t === id ? null : id));
                      setSelectedId(null);
                    }}
                  >
                    <Icon size={17} aria-hidden />
                    <span className="sr-only">{name}</span>
                  </button>
                ))}
                <div className="mx-1 border-t border-rule" aria-hidden />
                <button
                  type="button"
                  title={imageCount >= MAX_IMAGES ? `Up to ${MAX_IMAGES} images` : "Add image: pick a picture, crop it, then place it like a subject"}
                  disabled={imageCount >= MAX_IMAGES || state.actors.length >= MAX_ACTORS || isRestyle}
                  className="flex size-9 items-center justify-center rounded-xl text-ink transition-colors hover:bg-rule disabled:opacity-40 disabled:hover:bg-transparent"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus size={17} aria-hidden />
                  <span className="sr-only">Add image</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    pickImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="relative overflow-hidden rounded-xl border border-rule">
                <Storyboard
                  state={state}
                  layers={projected}
                  camera={camera}
                  colours={sketchColours}
                  keepColours={keepColours}
                  keepComposition={keepComposition}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onLayerChange={editFromSketch}
                  onLayerDelete={deleteActor}
                  onView={lookAround}
                  viewTool={viewTool}
                  drawings={drawings}
                  images={images}
                  puppet={tool === "puppet"}
                  onRigChange={(id, rig) => updateActor(id, { rig })}
                />
              </div>
              <CommentLayer comments={state.comments} active={commenting} onChange={(c) => set("comments", c)} />
              <EraseLayer active={tool === "erase"} onErase={eraseAt} onSweepEnd={endSweep} />
            </div>
            {selectedActor && side && (
              <div className="absolute top-0 overflow-y-auto" style={{ right: `calc(50% + ${side.board / 2 + 16}px)`, width: side.width, maxHeight: side.height }}>
                {transformPanel(selectedActor, true)}
              </div>
            )}
            </div>
            <p className="meta mt-2 text-center text-muted">
              {commenting ? (
                "Comment tool: click the preview to pin a note; drag a dot to move it, click it to edit, × to delete. Esc to finish."
              ) : tool === "puppet" ? (
                selectedActor && FIGURES.has(selectedActor.glyph)
                  ? "Puppet: drag a hand or foot and the limb follows; drag an elbow or knee to bend it, the head to lean, the hips to crouch. Esc to finish."
                  : "Puppet: click a person, child or robot to show the pins on its joints. Esc to finish."
              ) : tool === "erase" ? (
                "Eraser: click a subject, text or comment to remove it, or drag across several. Esc to finish."
              ) : (
                <>
                  {state.view === "3d"
                    ? "Drag the background to look around; Shift-drag or Pan to slide the view. What you see is the shot. "
                    : "A flat board: subjects move, resize and tilt only within the picture. "}
                  {state.actors.length === 0 ? "Use ADD + under Subject to place subjects." : "Click a subject to move, scale or rotate it."}
                </>
              )}
            </p>

            {aiNote && (
              <div role="status" className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-rule p-2 text-sm">
                <p className="min-w-0 flex-1">{aiNote.text}</p>
                {aiNote.undo && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      aiNote.undo?.();
                      setAiNote(null);
                    }}
                  >
                    <Undo2 size={14} aria-hidden />
                    Undo
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" aria-label="Dismiss" onClick={() => setAiNote(null)}>
                  <X size={14} aria-hidden />
                </button>
              </div>
            )}

            {selectedActor && !side && <div className="mt-4">{transformPanel(selectedActor, false)}</div>}

            <div className="mt-4">
              <PresetBar
                state={state}
                style={style}
                palette={palette}
                keepColours={keepColours}
                keepComposition={keepComposition}
                set={set}
                onStylePalette={() => setMode("style")}
                onCurated={setCurated}
                onColours={setColours}
                onCustom={editCustom}
                onAiSchemes={(request) => aiSchemes(state, request)}
              />
            </div>

            <div className="mt-8 border-t border-rule pt-5">
              <h2 id="output-title" className="text-2xl font-semibold tracking-[-0.02em]">
                Image prompt
              </h2>
              <p className="meta mt-1 text-muted">
                {style.name}, {state.task === "restyle" ? "restyling a source" : "new"}, {state.intensity} intensity. Colours: {keepColours ? "original colours" : palette.label}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn btn-sm btn-primary" disabled={aiBusy !== null} onClick={() => getIdeas(false)}>
                  <Sparkles size={14} aria-hidden />
                  {aiBusy === "concepts" ? "Thinking…" : concepts ? "New design ideas" : "Design ideas"}
                </button>
                {edited && (
                  <button type="button" className="btn btn-sm btn-ghost" disabled={aiBusy !== null} onClick={() => runScene("from-prompt", prompt)} title="Rebuild the scene so it matches the prompt as you’ve edited it">
                    <RefreshCw size={14} aria-hidden />
                    {aiBusy === "scene" ? "Updating…" : "Update scene from prompt"}
                  </button>
                )}
              </div>
              <ConceptCards
                concepts={concepts}
                loading={aiBusy === "concepts"}
                stale={concepts !== null && conceptsBasis !== composed.prompt}
                busy={aiBusy !== null}
                chosen={chosenConcept}
                onMore={() => getIdeas(true)}
                onUse={applyConcept}
              />
            </div>

            {staleEdit && (
              <div role="status" className="mt-4 flex flex-wrap items-center gap-3 border border-on-acid bg-acid p-3 text-sm text-on-acid">
                <p className="flex-1">Settings changed since you edited the prompt. Your edits are kept until you choose to regenerate.</p>
                <button type="button" className="btn btn-sm border-on-acid bg-transparent text-on-acid hover:bg-on-acid hover:text-acid" onClick={() => setConfirm("regenerate")}>
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
              className="mt-4 min-h-[22rem] w-full resize-y border border-ink bg-field p-4 font-mono text-[0.8125rem] leading-relaxed"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="meta text-muted">{edited ? "Edited by you. Settings changes won’t overwrite it." : "Generated from your settings. Type to edit."}</p>
              {edited && !staleEdit && (
                <button type="button" className="meta underline underline-offset-2" onClick={() => setConfirm("regenerate")}>
                  Discard edits and regenerate
                </button>
              )}
            </div>

            {edited && promptWarnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-alert">
                {promptWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

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
        </main>
      </div>

      {cropping && <ImageCropper file={cropping} onDone={(url, ratio) => void addImage(url, ratio)} onCancel={() => setCropping(null)} />}
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
