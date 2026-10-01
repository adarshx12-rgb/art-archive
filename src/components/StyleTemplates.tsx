import { ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { formatInfo, isTemplateFormat, templatesFor, textSlots } from "../content/templates";
import type { StyleRecord, TemplateFormat } from "../content/types";
import { composePrompt, templateState } from "../lib/prompt/compose";
import { encodeState, TEXT_MAX } from "../lib/prompt/state";
import { CopyButton } from "./actions";
import { TemplateStage } from "./TemplateStage";

/** The style page's design templates: a gallery of formats, and a studio to change the words and take one to the builder. */
export function StyleTemplates({ style }: { style: StyleRecord }) {
  const templates = templatesFor(style.slug);
  // ?template=poster (from the templates gallery or the header button) opens on that format.
  const [params] = useSearchParams();
  const asked = params.get("template");
  const linked = asked && isTemplateFormat(asked) && templates.some((t) => t.format === asked) ? asked : undefined;
  const [format, setFormat] = useState<TemplateFormat | undefined>(linked ?? templates[0]?.format);
  const [texts, setTexts] = useState<Partial<Record<TemplateFormat, Record<string, string>>>>({});
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!linked) return;
    setFormat(linked);
    sectionRef.current?.scrollIntoView({ block: "start" });
  }, [linked]);
  const template = templates.find((t) => t.format === format);
  if (!template) return null;

  const words = texts[template.format] ?? {};
  const info = formatInfo(template.format);
  const state = templateState(style, template.format, words);
  const prompt = composePrompt(state).prompt;
  const setWord = (id: string, value: string) => setTexts((all) => ({ ...all, [template.format]: { ...words, [id]: value } }));
  const edited = Object.values(words).some((w) => w.trim());

  return (
    <section ref={sectionRef} id="templates" className="wrap scroll-mt-16 border-t border-ink py-12" aria-labelledby="templates-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="templates-title" className="font-display text-h2 font-normal">
            Templates
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Starting layouts in the {style.name} look. Pick a format, change the words, then open it in the builder to add your image.
          </p>
        </div>
        <p className="meta text-muted">
          {templates.length} format{templates.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* ——— Gallery ——— */}
      <div role="radiogroup" aria-label="Template format" className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
        {templates.map((t) => {
          const on = t.format === template.format;
          const f = formatInfo(t.format);
          return (
            <button
              key={t.format}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setFormat(t.format)}
              className="group block min-w-0 text-left"
            >
              <TemplateStage
                template={t}
                style={style}
                texts={texts[t.format]}
                ratio={1}
                label={`${f.label}: ${t.name}`}
                className={`rounded-lg outline-offset-2 transition-[outline-color] ${on ? "outline-2 outline-ink" : "outline-2 outline-transparent group-hover:outline-rule-strong"}`}
              />
              <span className="mt-3 flex items-baseline justify-between gap-2">
                <span className={`text-[0.9375rem] ${on ? "font-semibold" : "group-hover:underline"}`}>{f.label}</span>
                <span className="meta shrink-0 text-muted">{f.aspect}</span>
              </span>
              <span className="meta mt-0.5 block truncate text-muted">
                {t.name}
                <span className="hidden sm:inline"> · {f.spec}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ——— Studio ——— */}
      <div className="mt-10 grid gap-8 border-t border-rule pt-10 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-8">
          <TemplateStage template={template} style={style} texts={words} ratio={info.ratio >= 1 ? 16 / 11 : 5 / 4.6} className="rounded-xl" />
          <p className="meta mt-2 text-center text-muted">
            {info.label} · {info.aspect} · {info.spec} · the image area shows one of this style’s AI-generated illustrations in place of your image
          </p>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-20 lg:col-span-4 lg:self-start" aria-labelledby="studio-title">
          <p className="meta text-muted">{info.label}</p>
          <h3 id="studio-title" className="mt-1 text-xl font-semibold">
            {template.name}
          </h3>
          <p className="mt-1 text-[0.9375rem] text-muted">{info.blurb}</p>

          <fieldset className="mt-6 min-w-0 space-y-3 border-t border-rule pt-5">
            <legend className="float-left mb-3 w-full font-semibold">Your words</legend>
            {textSlots(template).map((b) => (
              <div key={b.id} className="clear-both">
                <label htmlFor={`tt-${template.format}-${b.id}`} className="meta mb-1 block text-muted">
                  {b.label ?? b.kind}
                </label>
                <input
                  id={`tt-${template.format}-${b.id}`}
                  className="field w-full"
                  maxLength={TEXT_MAX}
                  placeholder={b.text?.replace(/\s*\n\s*/g, " / ")}
                  value={words[b.id] ?? ""}
                  onChange={(e) => setWord(b.id, e.target.value)}
                  autoComplete="off"
                />
              </div>
            ))}
            {edited && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTexts((all) => ({ ...all, [template.format]: {} }))}>
                <RotateCcw size={14} aria-hidden />
                Back to the sample words
              </button>
            )}
          </fieldset>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to={`/builder?${encodeState(state)}`} target="_blank" rel="noopener" aria-describedby="new-tab-note" className="btn btn-primary">
              Use template
              <ArrowRight size={16} aria-hidden />
            </Link>
            <CopyButton text={prompt} what={`${info.label.toLowerCase()} template prompt`}>
              Copy prompt
            </CopyButton>
          </div>

          <div className="mt-8 border-t border-rule pt-5">
            <h4 className="font-semibold">Why it works</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.9375rem] text-muted">
              {template.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
