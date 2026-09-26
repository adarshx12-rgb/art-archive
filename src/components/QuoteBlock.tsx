import type { Quote } from "../content/quotes";

interface Props {
  quote: Quote;
  /** "tall" fills a tall cell; "wide" suits a short, wide cell. */
  shape?: "tall" | "wide";
  className?: string;
}

/**
 * A typographic interlude: a large hanging quotation mark, the words set
 * light and large, and a sourced attribution in small monospace.
 */
export function QuoteBlock({ quote, shape = "wide", className = "" }: Props) {
  return (
    <figure className={`relative flex h-full flex-col border-t border-ink pt-3 ${className}`}>
      <div className={`flex flex-1 flex-col justify-center ${shape === "tall" ? "py-10 lg:py-16" : "py-8 lg:py-10"}`}>
        <blockquote className="relative pl-7 sm:pl-10">
          <span
            aria-hidden
            className="absolute top-[-0.18em] left-0 font-sans text-[3.5rem] leading-none font-extrabold text-acid [-webkit-text-stroke:1px_var(--color-ink)] sm:text-[4.5rem]"
          >
            “
          </span>
          <p
            className={`font-light tracking-[-0.025em] text-balance text-ink ${
              shape === "tall" ? "text-[1.75rem] leading-[1.1] sm:text-[2.35rem] xl:text-[2.75rem]" : "text-[1.5rem] leading-[1.15] sm:text-[1.9rem]"
            }`}
          >
            {quote.text}
          </p>
        </blockquote>
        <figcaption className="mt-6 pl-7 sm:pl-10">
          <span className="block text-[0.9375rem] font-semibold">{quote.author}</span>
          <span className="meta mt-0.5 block text-muted">
            {quote.role}. <cite className="not-italic">{quote.source}</cite>, {quote.year}
            {quote.translated ? ", in translation" : ""}.
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
