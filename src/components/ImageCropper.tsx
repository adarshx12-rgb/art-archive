import { Check, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

/**
 * The crop window for a picture being added to the sketch: drag the box to
 * move it, its corners and edges to resize it, pick a shape, then ✓ to add.
 * The result is at most MAX_SIDE pixels on its longer side.
 */

const MAX_SIDE = 1600;
const MIN = 0.05;
const SHAPES = [
  { id: "free", label: "Free", ratio: null },
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "4:5", label: "4:5", ratio: 4 / 5 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
] as const;

/** The crop box, as fractions of the picture. */
type Box = { x: number; y: number; w: number; h: number };
/** Which part is being dragged: the box, or a side or corner (n, s, e, w, ne…). */
type Grip = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function ImageCropper({ file, onDone, onCancel }: { file: File; onDone: (dataUrl: string, ratio: number) => void; onCancel: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<Box>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [shape, setShape] = useState<(typeof SHAPES)[number]["id"]>("free");
  const [failed, setFailed] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ grip: Grip; x: number; y: number; box: Box } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      // A focused button handles Enter itself.
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) finish();
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  });

  /** A box of this picture-shape (width / height in pixels), as large as fits, centred on the current one. */
  const fitShape = (ratio: number | null, from: Box): Box => {
    if (!ratio || !natural) return from;
    // In fractions, w / h must equal ratio * natural.h / natural.w.
    const k = (ratio * natural.h) / natural.w;
    let w = Math.min(from.w, 1);
    let h = w / k;
    if (h > 1) {
      h = 1;
      w = k;
    }
    const cx = from.x + from.w / 2;
    const cy = from.y + from.h / 2;
    return { w, h, x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h) };
  };
  const ratioNow = SHAPES.find((s) => s.id === shape)!.ratio;

  const start = (e: PointerEvent, grip: Grip) => {
    e.preventDefault();
    e.stopPropagation();
    frame.current?.setPointerCapture(e.pointerId);
    drag.current = { grip, x: e.clientX, y: e.clientY, box };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    const r = frame.current?.getBoundingClientRect();
    if (!d || !r) return;
    const dx = (e.clientX - d.x) / r.width;
    const dy = (e.clientY - d.y) / r.height;
    const b = d.box;
    if (d.grip === "move") {
      setBox({ ...b, x: clamp(b.x + dx, 0, 1 - b.w), y: clamp(b.y + dy, 0, 1 - b.h) });
      return;
    }
    let { x, y, w, h } = b;
    if (d.grip.includes("e")) w = clamp(b.w + dx, MIN, 1 - b.x);
    if (d.grip.includes("w")) {
      x = clamp(b.x + dx, 0, b.x + b.w - MIN);
      w = b.x + b.w - x;
    }
    if (d.grip.includes("s")) h = clamp(b.h + dy, MIN, 1 - b.y);
    if (d.grip.includes("n")) {
      y = clamp(b.y + dy, 0, b.y + b.h - MIN);
      h = b.y + b.h - y;
    }
    if (ratioNow && natural) {
      // A fixed shape follows the width; the height grows from the side not being dragged.
      const k = (ratioNow * natural.h) / natural.w;
      h = w / k;
      if (d.grip.includes("n")) y = b.y + b.h - h;
      if (y < 0 || y + h > 1) return;
    }
    setBox({ x, y, w, h });
  };
  const end = () => {
    drag.current = null;
  };

  function finish() {
    const pic = img.current;
    if (!pic || !natural) return;
    const sw = Math.max(1, Math.round(box.w * natural.w));
    const sh = Math.max(1, Math.round(box.h * natural.h));
    const k = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * k));
    canvas.height = Math.max(1, Math.round(sh * k));
    const ctx = canvas.getContext("2d");
    if (!ctx) return setFailed(true);
    ctx.drawImage(pic, box.x * natural.w, box.y * natural.h, sw, sh, 0, 0, canvas.width, canvas.height);
    // PNG keeps transparency; photos are smaller as JPEG.
    const url = file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.9);
    onDone(url, sw / sh);
  }

  const grips: Grip[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
  const gripAt: Record<Grip, string> = {
    move: "",
    nw: "left-0 top-0 cursor-nwse-resize",
    n: "left-1/2 top-0 cursor-ns-resize",
    ne: "left-full top-0 cursor-nesw-resize",
    e: "left-full top-1/2 cursor-ew-resize",
    se: "left-full top-full cursor-nwse-resize",
    s: "left-1/2 top-full cursor-ns-resize",
    sw: "left-0 top-full cursor-nesw-resize",
    w: "left-0 top-1/2 cursor-ew-resize",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Crop the image">
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-2xl border border-rule bg-paper p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Crop the image</h2>
          <div className="seg" role="radiogroup" aria-label="Crop shape">
            {SHAPES.map((s) => (
              <label key={s.id}>
                <input
                  type="radio"
                  name="crop-shape"
                  checked={shape === s.id}
                  onChange={() => {
                    setShape(s.id);
                    setBox((b) => fitShape(s.ratio, b));
                  }}
                />
                {shape === s.id && <span aria-hidden>✓</span>}
                {s.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 justify-center">
          {src && (
            <div ref={frame} className="relative touch-none overflow-hidden select-none" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
              <img
                ref={img}
                src={src}
                alt="The image being cropped"
                className="block max-h-[62dvh] max-w-full"
                draggable={false}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onError={() => setFailed(true)}
              />
              {natural && (
                <div
                  className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
                  onPointerDown={(e) => start(e, "move")}
                  aria-label="Crop area: drag to move"
                >
                  {/* Rule of thirds */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33.2%,rgb(255_255_255/0.45)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/0.45)_66.6%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.2%,rgb(255_255_255/0.45)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/0.45)_66.6%,transparent_66.8%)]" />
                  {grips
                    .filter((g) => !ratioNow || g.length === 2)
                    .map((g) => (
                      <span key={g} className={`absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-ink bg-white ${gripAt[g]}`} onPointerDown={(e) => start(e, g)} aria-hidden />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
        {failed && <p className="text-sm text-alert">This image couldn’t be opened. Try a JPG, PNG or WebP file.</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="meta text-muted">Drag the box to move it, its corners or edges to resize. Enter to add, Esc to cancel.</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onCancel} aria-label="Cancel">
              <X size={18} aria-hidden />
            </button>
            <button type="button" className="btn btn-primary" onClick={finish} disabled={!natural} aria-label="Add the cropped image" autoFocus>
              <Check size={18} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
