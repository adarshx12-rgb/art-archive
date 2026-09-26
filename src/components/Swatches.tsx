import { copyText } from "../lib/clipboard";
import { inkOn } from "../lib/color";
import { useToast } from "../state/toast";

/** A thin strip of colour — decorative, labelled for assistive tech. */
export function SwatchStrip({ colours, className = "", label }: { colours: string[]; className?: string; label: string }) {
  return (
    <div role="img" aria-label={label} className={`flex h-2 overflow-hidden ${className}`}>
      {colours.map((c, i) => (
        <span key={`${c}${i}`} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}

/** Swatch that copies its hex code. Shows the code as text, so colour is never the only cue. */
export function HexSwatch({
  hex,
  name,
  share,
  role,
  tall = false,
}: {
  hex: string;
  name?: string;
  share?: number;
  role?: string;
  tall?: boolean;
}) {
  const toast = useToast();
  const ink = inkOn(hex);
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(hex);
        toast(ok ? `Copied ${hex}` : `Couldn’t copy ${hex} automatically. Select it and copy manually.`, ok ? "ok" : "error");
      }}
      className={`group relative flex w-full flex-col justify-end border border-black/10 p-2 text-left ${tall ? "min-h-40" : "min-h-20"}`}
      style={{ background: hex, color: ink }}
      aria-label={`Copy ${hex}${name ? `, ${name}` : ""}`}
    >
      {role && <span className="meta opacity-80">{role}{share !== undefined ? ` · ${share}%` : ""}</span>}
      {name && <span className="text-sm leading-tight font-medium">{name}</span>}
      <span className="meta">{hex}</span>
    </button>
  );
}
