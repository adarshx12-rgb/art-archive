import { useEffect, useRef, useState } from "react";
import { StyleArt } from "../art/StyleArt";
import { formatInfo, styleColours, type RoleColours } from "../content/templates";
import type { StyleRecord, StyleTemplate } from "../content/types";
import { TemplatePreview, useTemplateFonts } from "./TemplatePreview";

export interface TemplateStageProps {
  template: StyleTemplate;
  /** The style the template belongs to; its cover fills the image areas. */
  style: StyleRecord;
  colours?: RoleColours;
  texts?: Record<string, string>;
  /** The stage's own width / height; 1 for gallery tiles. */
  ratio: number;
  className?: string;
  label?: string;
  /** Draw only when scrolled near, for galleries of many templates. */
  lazy?: boolean;
}

/**
 * A template shown like a print mockup: centred on a neutral surface, at its
 * true proportions, as large as the stage allows. Every stage of a gallery is
 * the same shape, so covers, posters and thumbnails line up in tidy rows.
 */
export function TemplateStage({ template, style, colours, texts, ratio, className = "", label, lazy = false }: TemplateStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(!lazy);
  useEffect(() => {
    if (near || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") return setNear(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && (setNear(true), io.disconnect()), { rootMargin: "800px 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);

  const piece = formatInfo(template.format).ratio;
  // Taller than the stage: fit the height. Wider: fit the width.
  const fit = piece <= ratio ? { height: "86%", width: "auto" } : { width: "86%", height: "auto" };
  return (
    <div ref={ref} className={`flex items-center justify-center bg-paper-2 ${className}`} style={{ aspectRatio: String(ratio) }}>
      <div style={{ ...fit, aspectRatio: String(piece), maxWidth: "86%", maxHeight: "86%" }} className={near ? "shadow-[0_10px_30px_-8px_rgb(0_0_0/0.45),0_2px_6px_rgb(0_0_0/0.15)]" : "bg-rule/40"}>
        {near && <Piece template={template} style={style} colours={colours} texts={texts} label={label} />}
      </div>
    </div>
  );
}

function Piece({ template, style, colours, texts, label }: Pick<TemplateStageProps, "template" | "style" | "colours" | "texts" | "label">) {
  useTemplateFonts([template]);
  return (
    <TemplatePreview
      template={template}
      colours={colours ?? styleColours(style)}
      texts={texts}
      image={<StyleArt style={style} aspect="h-full w-full" label={false} />}
      label={label}
      className="h-full w-full"
    />
  );
}
