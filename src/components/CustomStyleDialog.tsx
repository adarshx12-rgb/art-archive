import { useEffect, useId, useRef, useState } from "react";
import { CUSTOM_STYLE_MAX, customTemplates, type CustomStyleSpec } from "../content/styles/custom";

interface Props {
  open: boolean;
  /** The description to start from: the current custom style, if any. */
  initial: CustomStyleSpec;
  onSave: (spec: CustomStyleSpec) => void;
  onCancel: () => void;
}

/**
 * Describe your own style, optionally starting from a template. Native
 * <dialog> like ConfirmDialog: focus trapping, Escape and an inert page.
 */
export function CustomStyleDialog({ open, initial, onSave, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [spec, setSpec] = useState<CustomStyleSpec>(initial);
  const titleId = useId();
  const textId = useId();
  const hintId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setSpec(initial);
      returnFocus.current = document.activeElement as HTMLElement | null;
      d.showModal();
      textRef.current?.focus();
    } else if (!open && d.open) {
      d.close();
      returnFocus.current?.focus();
    }
    // `initial` is read only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const text = spec.text.trim();

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-[3px] border border-ink bg-paper p-0 text-ink backdrop:bg-black/55"
    >
      <form
        className="p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (text) onSave({ template: spec.template, text });
        }}
      >
        <h2 id={titleId} className="text-2xl font-semibold tracking-[-0.02em]">
          Custom style
        </h2>
        <p className="mt-2 text-[0.9375rem] text-muted">Describe the look in your own words, or start from a template and change it.</p>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">Start from</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {customTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={spec.template === t.id}
                onClick={() => {
                  setSpec({ template: t.id, text: t.text });
                  textRef.current?.focus();
                }}
                className="border border-rule p-2.5 text-left hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
              >
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="mt-0.5 block text-xs opacity-75">{t.blurb}</span>
              </button>
            ))}
            <button
              type="button"
              aria-pressed={spec.template === null}
              onClick={() => {
                setSpec({ template: null, text: "" });
                textRef.current?.focus();
              }}
              className="border border-dashed border-rule p-2.5 text-left hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
            >
              <span className="block text-sm font-medium">From scratch</span>
              <span className="mt-0.5 block text-xs opacity-75">An empty description</span>
            </button>
          </div>
        </fieldset>

        <label htmlFor={textId} className="mt-5 mb-2 block text-sm font-medium">
          Description
        </label>
        <textarea
          ref={textRef}
          id={textId}
          aria-describedby={hintId}
          rows={5}
          maxLength={CUSTOM_STYLE_MAX}
          value={spec.text}
          onChange={(e) => setSpec((s) => ({ ...s, text: e.target.value }))}
          placeholder="e.g. thick wax crayon on cheap paper, scribbled fills that run past the lines"
          className="field w-full resize-y"
        />
        <p id={hintId} className="mt-1 text-xs text-muted">
          {spec.text.length}/{CUSTOM_STYLE_MAX} characters. Your words go into the prompt as written.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!text}>
            Use this style
          </button>
        </div>
      </form>
    </dialog>
  );
}
