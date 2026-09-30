import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatInfo, isTextBlock, slotText, type RoleColours } from "../content/templates";
import type { StyleTemplate, TemplateBlock } from "../content/types";

/**
 * Draws a design template at any size: positions are fractions of the canvas
 * and type is sized in container units, so a small card and a full preview
 * look the same. Image areas show `image` (the style's cover or study); in
 * `overlay` mode they are left see-through with a dashed outline, so the
 * builder's sketch shows underneath.
 */

/** Font styles already requested this visit ("Family|italic,weight"), so a gallery of many templates asks for each once. */
const requested = new Set<string>();

/** Loads each family at the weights and styles the templates use; each is requested once per visit and kept. */
export function useTemplateFonts(templates: StyleTemplate[]) {
  const wanted = new Map<string, Set<string>>();
  for (const t of templates)
    for (const b of t.blocks) {
      if (!b.font) continue;
      const set = wanted.get(b.font) ?? new Set<string>();
      set.add(`${b.italic ? 1 : 0},${b.weight ?? 400}`);
      wanted.set(b.font, set);
    }
  const key = [...wanted.entries()].map(([f, a]) => `${f}:${[...a].sort().join(";")}`).join("|");
  useEffect(() => {
    for (const [family, axes] of wanted) {
      const fresh = [...axes].filter((a) => !requested.has(`${family}|${a}`)).sort();
      if (!fresh.length) continue;
      fresh.forEach((a) => requested.add(`${family}|${a}`));
      const italic = fresh.some((a) => a.startsWith("1"));
      const spec = italic ? `ital,wght@${fresh.join(";")}` : `wght@${fresh.map((a) => a.slice(2)).join(";")}`;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${spec}&display=swap`;
      document.head.appendChild(link);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

const pct = (n: number) => `${n * 100}%`;

function boxStyle(b: TemplateBlock): React.CSSProperties {
  return {
    position: "absolute",
    left: pct(b.x),
    top: pct(b.y),
    width: pct(b.w),
    height: pct(b.h),
    transform: b.rotate ? `rotate(${b.rotate}deg)` : undefined,
    opacity: b.opacity,
  };
}

/** Rounded corners that crop an image or shape to the named form. */
const CLIP: Partial<Record<NonNullable<TemplateBlock["shape"]>, string>> = {
  circle: "50%",
  arc: "50% 50% 0 0 / 100% 100% 0 0",
};

function Shape({ b, c }: { b: TemplateBlock; c: RoleColours }) {
  const fill = b.fill ? c[b.fill] : "transparent";
  const stroke = b.stroke ? c[b.stroke] : "transparent";
  switch (b.shape) {
    case "stripes":
      return (
        <div style={{ ...boxStyle(b), display: "flex", flexDirection: "column" }} aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, background: i % 2 ? stroke : fill }} />
          ))}
        </div>
      );
    case "sunburst":
      return (
        <svg style={boxStyle(b)} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {Array.from({ length: 18 }, (_, i) => {
            if (i % 2) return null;
            const a0 = Math.PI + (i / 18) * Math.PI;
            const a1 = Math.PI + ((i + 1) / 18) * Math.PI;
            const r = 160;
            return <path key={i} d={`M50 100 L${50 + r * Math.cos(a0)} ${100 + r * Math.sin(a0)} L${50 + r * Math.cos(a1)} ${100 + r * Math.sin(a1)} Z`} fill={fill} />;
          })}
        </svg>
      );
    case "frame":
      return (
        <div
          style={{ ...boxStyle(b), border: `calc(min(${b.w * 100}cqw, ${b.h * 100}cqh) * 0.03) solid ${b.stroke ? stroke : fill}`, boxSizing: "border-box" }}
          aria-hidden
        />
      );
    default:
      // rect, circle, arc and line; a stroke draws an outline (an orbit ring, a window edge).
      return (
        <div
          style={{
            ...boxStyle(b),
            // A line is drawn in whichever colour it names.
            background: b.shape === "line" && !b.fill ? stroke : fill,
            borderRadius: b.shape ? CLIP[b.shape] : undefined,
            border: b.stroke && b.shape !== "line" ? `calc(min(${b.w * 100}cqw, ${b.h * 100}cqh) * 0.03) solid ${stroke}` : undefined,
            boxSizing: "border-box",
          }}
          aria-hidden
        />
      );
  }
}

/**
 * Shrinks the words until they fit their box: display faces run wider than any
 * estimate, and visitors type long words. Re-measures when fonts arrive.
 */
function useFit(words: string, font?: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.setProperty("--fit", "1");
      let s = 1;
      for (let i = 0; i < 12 && (el.scrollHeight > el.clientHeight * 1.04 + 1 || el.scrollWidth > el.clientWidth + 1); i++) {
        s *= 0.92;
        el.style.setProperty("--fit", String(s));
      }
      setScale(s);
    };
    fit();
    // Web fonts arrive after the first measure; refit whenever one finishes loading.
    document.fonts?.addEventListener("loadingdone", fit);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(el);
    return () => {
      document.fonts?.removeEventListener("loadingdone", fit);
      ro?.disconnect();
    };
  }, [words, font]);
  return { ref, scale };
}

function Text({ b, c, words }: { b: TemplateBlock; c: RoleColours; words: string }) {
  const size = b.size ?? 0.05;
  const { ref, scale } = useFit(words, b.font);
  return (
    <div
      ref={ref}
      style={{
        ["--fit" as string]: String(scale),
        ...boxStyle(b),
        fontFamily: b.font ? `"${b.font}", system-ui, sans-serif` : undefined,
        fontWeight: b.weight ?? 400,
        fontStyle: b.italic ? "italic" : undefined,
        fontSize: `calc(${size * 100}cqh * var(--fit, 1))`,
        overflow: "hidden",
        lineHeight: b.leading ?? 1.15,
        letterSpacing: b.tracking ? `${b.tracking}em` : undefined,
        textTransform: b.upper ? "uppercase" : undefined,
        textAlign: b.align ?? "left",
        color: c[b.colour ?? "primary"],
        // A word too long for the box shrinks the text rather than breaking mid-word.
        overflowWrap: "normal",
        whiteSpace: "pre-line",
      }}
    >
      {words}
    </div>
  );
}

export interface TemplatePreviewProps {
  template: StyleTemplate;
  colours: RoleColours;
  /** Visitor's words by block id; blank uses the sample. */
  texts?: Record<string, string>;
  /** What fills image areas. */
  image?: React.ReactNode;
  /** Builder: no page colour, image areas see-through. */
  overlay?: boolean;
  className?: string;
  label?: string;
}

export function TemplatePreview({ template, colours, texts = {}, image, overlay = false, className = "", label }: TemplatePreviewProps) {
  const f = formatInfo(template.format);
  const words = slotText(template, texts);
  return (
    <div
      role="img"
      aria-label={label ?? `${f.label} layout: ${template.name}. ${Object.values(words).join(" · ")}`}
      className={`${overlay ? "absolute inset-0" : "relative"} overflow-hidden ${className}`}
      style={{ aspectRatio: String(f.ratio), containerType: "size", background: overlay ? undefined : colours[template.background] }}
    >
      {template.blocks.map((b) => {
        if (b.kind === "image") {
          const radius = b.shape ? CLIP[b.shape] : undefined;
          return overlay ? (
            <div key={b.id} style={{ ...boxStyle(b), borderRadius: radius, outline: "1.5px dashed rgba(78,155,255,.9)", outlineOffset: "-1.5px" }} aria-hidden>
              <span className="meta absolute top-1 left-1 rounded-[2px] bg-[#4E9BFF] px-1 text-[10px] text-white">Image</span>
            </div>
          ) : (
            <div key={b.id} style={{ ...boxStyle(b), borderRadius: radius, overflow: "hidden", ["--focus" as string]: b.focus === undefined && b.focusX === undefined ? undefined : `${(b.focusX ?? 0.5) * 100}% ${(b.focus ?? 0.5) * 100}%`, ["--zoom" as string]: b.zoom }} aria-hidden>
              {image}
            </div>
          );
        }
        if (b.kind === "shape") return <Shape key={b.id} b={b} c={colours} />;
        if (isTextBlock(b)) return <Text key={b.id} b={b} c={colours} words={words[b.id]!} />;
        return null;
      })}
    </div>
  );
}
