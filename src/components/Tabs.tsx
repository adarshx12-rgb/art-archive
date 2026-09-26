import { useId, useRef, useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

/** WAI-ARIA tabs with arrow-key, Home and End navigation. */
export function Tabs({ tabs, label, initial }: { tabs: Tab[]; label: string; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]!.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  const onKey = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      setActive(tabs[next]!.id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap border-b border-ink">
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`-mb-px min-h-11 border border-b-0 px-4 text-[0.9375rem] ${
                selected ? "border-ink bg-ink font-semibold text-paper" : "border-transparent hover:underline"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="pt-5 focus-visible:outline-offset-4"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
