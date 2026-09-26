import { useEffect, useId, useRef, useState } from "react";
import type { StyleRecord } from "../content/types";
import { renderers } from "./studies";
import { H, W, type Colours } from "./util";

interface Props {
  style: StyleRecord;
  /** Recolour the study (2–4 colours, cycled to fill four slots). */
  colours?: string[];
  className?: string;
  /** Render immediately instead of waiting until near the viewport. */
  eager?: boolean;
  /** Show the "Illustrative study" label. */
  label?: boolean;
  zoom?: boolean;
  /** Tailwind aspect class(es); the SVG crops to fit. */
  aspect?: string;
}

function toFour(list: string[]): Colours {
  const src = list.length ? list : ["#DDD"];
  return [0, 1, 2, 3].map((i) => src[i % src.length]!) as unknown as Colours;
}

/**
 * An original SVG study for a style. Studies below the fold are mounted
 * when they approach the viewport; until then a flat block in the style's
 * ground colour holds their space (no spinner, nothing simulated).
 */
export function StyleArt({ style, colours, className = "", eager = false, label = true, zoom = false, aspect = "aspect-[4/5]" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const k = toFour(colours ?? style.swatches.map((s) => s.hex));
  const render = renderers[style.art.renderer ?? style.slug];
  const recoloured = Boolean(colours);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  const alt = `${recoloured ? "Recoloured illustrative" : "Illustrative"} study for ${style.name}: ${style.look.composition}.`;

  return (
    <div ref={ref} className={`relative overflow-hidden ${aspect} ${className}`} style={{ background: k[0] }}>
      {visible && render ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label={alt}
          preserveAspectRatio="xMidYMid slice"
          className={`h-full w-full ${zoom ? "art-zoom" : ""}`}
        >
          {render(k, `s${uid}`)}
        </svg>
      ) : (
        <span className="sr-only">{alt}</span>
      )}
      {label && (
        <span className="meta absolute bottom-2 left-2 rounded-[2px] bg-paper/90 px-1.5 py-0.5 text-ink">
          {recoloured ? "Illustrative study · recoloured" : "Illustrative study"}
        </span>
      )}
    </div>
  );
}
