import { ExternalLink } from "lucide-react";
import type { ReferenceImage } from "../content/types";

interface Props {
  image: ReferenceImage;
  eager?: boolean;
  className?: string;
  /** Crop to a fixed aspect for collages; detail pages show the full image. */
  crop?: string;
  compact?: boolean;
}

/** A photographed / scanned reference with visible credit and licence. */
export function ReferenceFigure({ image, eager = false, className = "", crop, compact = false }: Props) {
  return (
    <figure className={className}>
      <div className={`overflow-hidden bg-paper-2 ${crop ?? ""}`}>
        <img
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`h-full w-full ${crop ? "object-cover" : "h-auto"}`}
        />
      </div>
      <figcaption className="mt-2 space-y-1">
        {!compact && <p className="text-sm leading-snug text-ink">{image.caption}</p>}
        <p className="meta text-muted">
          {image.creator}, <cite className="not-italic">{image.title}</cite>, {image.date}.{" "}
          {image.licenceUrl ? (
            <a href={image.licenceUrl} className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
              {image.licence}
            </a>
          ) : (
            image.licence
          )}
          {" · "}
          <a
            href={image.sourceUrl}
            className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Source<span className="sr-only"> on {image.sourceName} (opens in a new tab)</span>
            <ExternalLink size={11} aria-hidden />
          </a>
        </p>
      </figcaption>
    </figure>
  );
}
