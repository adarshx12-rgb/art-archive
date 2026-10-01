import { useEffect, useRef, useState } from "react";
import { StyleArt } from "../art/StyleArt";
import { covers, similarCovers } from "../content/covers";
import { formatInfo, styleColours, TEMPLATE_FORMATS, type RoleColours } from "../content/templates";
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

/**
 * Default crop for image areas, per format, so a style's four templates don't
 * all show the same picture framed the same way. A block's own focus and zoom
 * (set on the block) still win, since these are inherited CSS variables.
 */
const CROPS: Record<string, { focus: string; zoom: number }> = {
  magazine: { focus: "50% 35%", zoom: 1 },
  poster: { focus: "50% 50%", zoom: 1 },
  flyer: { focus: "35% 45%", zoom: 1.25 },
  thumbnail: { focus: "65% 40%", zoom: 1.4 },
};

/** The illustration for a template: formats take turns through the style's illustrations, when it has more than one. */
function imageFor(style: StyleRecord, format: StyleTemplate["format"]) {
  const main = covers[style.slug];
  if (!main) return { cover: undefined, crop: CROPS[format] };
  const all = [main, ...similarCovers(style.slug)];
  const i = TEMPLATE_FORMATS.findIndex((f) => f.id === format);
  const cover = all[i % all.length]!;
  // A repeated illustration gets this format's crop; a fresh one is shown whole.
  const repeated = all.length === 1 || i >= all.length;
  return { cover, crop: repeated ? CROPS[format] : CROPS.poster };
}

function Piece({ template, style, colours, texts, label }: Pick<TemplateStageProps, "template" | "style" | "colours" | "texts" | "label">) {
  useTemplateFonts([template]);
  const { cover, crop } = imageFor(style, template.format);
  return (
    <div className="h-full w-full" style={{ ["--focus" as string]: crop?.focus, ["--zoom" as string]: crop?.zoom }}>
      <TemplatePreview
        template={template}
        colours={colours ?? styleColours(style)}
        texts={texts}
        image={<StyleArt style={style} aspect="h-full w-full" image={cover} />}
        label={label}
        className="h-full w-full"
      />
    </div>
  );
}
