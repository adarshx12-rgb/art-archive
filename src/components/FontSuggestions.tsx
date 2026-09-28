import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { FontLicence, FontSuggestion } from "../content/fonts";

const LICENCES: { id: FontLicence; label: string; hint: string }[] = [
  { id: "free", label: "Free", hint: "Google Fonts, free for commercial use" },
  { id: "paid", label: "Paid", hint: "Needs a licence from the foundry" },
];

/** Loads a Google Fonts preview, subset to the characters shown. */
function useGooglePreview(families: string[], text: string) {
  const key = families.join("|");
  useEffect(() => {
    const links = families.map((family) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&text=${encodeURIComponent(text)}&display=swap`;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l.remove());
  }, [key, text]);
}

export function FontSuggestions({ fonts, sample }: { fonts: FontSuggestion[]; sample: string }) {
  const [show, setShow] = useState<Record<FontLicence, boolean>>({ free: true, paid: true });
  const visible = fonts.filter((f) => show[f.licence]);
  useGooglePreview(
    fonts.filter((f) => f.licence === "free").map((f) => f.family),
    sample,
  );

  return (
    <div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Show fonts</legend>
        {LICENCES.map((l) => {
          const on = show[l.id];
          const count = fonts.filter((f) => f.licence === l.id).length;
          return (
            <label
              key={l.id}
              title={l.hint}
              className={`flex min-h-10 cursor-pointer items-center gap-2 border px-3 text-sm ${on ? "border-ink bg-ink text-paper" : "border-rule-strong"}`}
            >
              <input type="checkbox" checked={on} onChange={() => setShow((s) => ({ ...s, [l.id]: !s[l.id] }))} className="h-4 w-4 accent-[#DFFF70]" />
              {l.label} ({count})
            </label>
          );
        })}
      </fieldset>

      {visible.length === 0 ? (
        <p className="mt-6 text-muted">Select Free or Paid to see fonts.</p>
      ) : (
        <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {visible.map((f) => (
            <li key={f.family} className="border-t border-rule py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="meta text-muted">{f.role}</span>
                <span className={`meta rounded-[2px] px-1.5 py-0.5 ${f.licence === "free" ? "bg-ink text-paper" : "border border-rule-strong"}`}>
                  {f.licence === "free" ? "Free" : "Paid"}
                </span>
              </div>
              <p className="mt-2 text-xl font-semibold tracking-[-0.01em]">{f.family}</p>
              {f.licence === "free" ? (
                <p className="mt-1 truncate text-3xl leading-tight" style={{ fontFamily: `"${f.family}", var(--font-sans, sans-serif)` }} aria-hidden>
                  {sample}
                </p>
              ) : (
                <p className="meta mt-1 text-muted">No preview for licensed fonts</p>
              )}
              <p className="mt-2 text-[0.9375rem] leading-snug text-muted">{f.why}</p>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="meta mt-2 inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-ink"
              >
                {f.licence === "free" ? "Get it on Google Fonts" : `Get it from ${f.source}`}
                <span className="sr-only"> (opens in a new tab)</span>
                <ExternalLink size={11} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
