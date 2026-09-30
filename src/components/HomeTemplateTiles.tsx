import { Link } from "react-router";
import { getStyle } from "../content/styles";
import { formatInfo, getTemplate } from "../content/templates";
import type { TemplateFormat } from "../content/types";
import { TemplateStage } from "./TemplateStage";

/** One template of each format, from different styles. Loaded on its own, so the template data stays out of the home page's first download. */
const PICKS: [string, TemplateFormat][] = [
  ["art-deco", "magazine"],
  ["bauhaus", "poster"],
  ["vaporwave", "flyer"],
  ["y2k", "thumbnail"],
];

export default function HomeTemplateTiles() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      {PICKS.flatMap(([slug, format]) => {
        const style = getStyle(slug);
        const template = style && getTemplate(slug, format);
        if (!style || !template) return [];
        const f = formatInfo(format);
        return [
          <li key={slug}>
            <Link to={`/styles/${slug}?template=${format}`} className="group block min-w-0">
              <TemplateStage
                template={template}
                style={style}
                ratio={1}
                lazy
                label={`${style.name} ${f.label.toLowerCase()}: ${template.name}`}
                className="rounded-lg outline-2 outline-offset-2 outline-transparent transition-[outline-color] group-hover:outline-rule-strong"
              />
              <span className="mt-3 flex items-baseline justify-between gap-2">
                <span className="truncate text-[0.9375rem] group-hover:underline">{f.label}</span>
                <span className="meta shrink-0 text-muted">{style.name}</span>
              </span>
            </Link>
          </li>,
        ];
      })}
    </ul>
  );
}

