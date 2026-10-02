import { useRef, type PointerEvent } from "react";

/**
 * The eraser over the preview: a click, or a drag across it, reports each
 * point it touches (as fractions of the frame, plus the frame's size in
 * pixels) so the builder can remove whatever is there. One press is one sweep.
 */
export function EraseLayer({
  active,
  onErase,
  onSweepEnd,
}: {
  active: boolean;
  onErase: (x: number, y: number, size: { width: number; height: number }) => void;
  onSweepEnd: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const down = useRef(false);

  const report = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    onErase((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, { width: r.width, height: r.height });
  };

  if (!active) return null;
  return (
    <div
      ref={ref}
      className="absolute inset-0 touch-none"
      // An eraser-shaped cursor: a tilted block with its tip at the hot spot.
      style={{
        cursor: `url("data:image/svg+xml,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linejoin="round"><path d="M7 21h10" stroke="white" stroke-width="4"/><path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 21" fill="white"/><path d="M7 21h10M22 21H7M5 11l9 9"/></svg>',
        )}") 4 20, crosshair`,
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        down.current = true;
        report(e);
      }}
      onPointerMove={(e) => {
        if (down.current) report(e);
      }}
      onPointerUp={() => {
        if (!down.current) return;
        down.current = false;
        onSweepEnd();
      }}
      onPointerCancel={() => {
        down.current = false;
        onSweepEnd();
      }}
      aria-label="Eraser: click or drag over subjects and comments to remove them"
    />
  );
}
