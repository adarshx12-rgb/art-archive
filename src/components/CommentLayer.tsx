import { X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { COMMENT_MAX, MAX_COMMENTS, type Comment } from "../lib/prompt/state";

/**
 * Numbered comments pinned to the preview. With the comment tool on, a click
 * drops a dot and opens its box; dots can be dragged, reopened and deleted.
 * With it off, the dots only show where the notes are.
 */
export function CommentLayer({ comments, active, onChange }: { comments: Comment[]; active: boolean; onChange: (next: Comment[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);

  // Turning the tool off closes the box, dropping a comment left empty.
  useEffect(() => {
    if (!active) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const at = (e: { clientX: number; clientY: number }) => {
    const r = ref.current!.getBoundingClientRect();
    const unit = (n: number) => Math.round(Math.min(Math.max(n, 0), 1) * 1000) / 1000;
    return { x: unit((e.clientX - r.left) / r.width), y: unit((e.clientY - r.top) / r.height) };
  };
  const update = (id: string, patch: Partial<Comment>) => onChange(comments.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => {
    onChange(comments.filter((c) => c.id !== id));
    if (openId === id) setOpenId(null);
  };
  function close() {
    if (!openId) return;
    const c = comments.find((x) => x.id === openId);
    if (c && !c.text.trim()) onChange(comments.filter((x) => x.id !== openId));
    setOpenId(null);
  }

  const place = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || e.target !== e.currentTarget || e.button !== 0) return;
    // Keep the browser from moving focus on this click, which would blur (and drop) the new comment's box.
    e.preventDefault();
    // A click away from an open box just closes it.
    if (openId) return close();
    if (comments.length >= MAX_COMMENTS) return;
    const c = { id: `n${Date.now().toString(36)}`, ...at(e), text: "" };
    onChange([...comments, c]);
    setOpenId(c.id);
  };

  const grab = (e: PointerEvent<HTMLButtonElement>, c: Comment) => {
    if (!active || e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: c.id, x: e.clientX, y: e.clientY, moved: false };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
    d.moved = true;
    update(d.id, at(e));
  };
  const drop = (c: Comment) => {
    const d = drag.current;
    drag.current = null;
    // A click without a drag opens the comment.
    if (d && !d.moved) setOpenId(openId === c.id ? null : c.id);
  };

  return (
    <div
      ref={ref}
      className={`absolute inset-0 ${active ? "cursor-crosshair" : "pointer-events-none"}`}
      onPointerDown={place}
      aria-label={active ? "Click the preview to add a comment" : undefined}
    >
      {comments.map((c, i) => {
        const open = openId === c.id;
        const left = c.x > 0.55;
        return (
          <div key={c.id} className="group absolute" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}>
            <button
              type="button"
              className={`absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full rounded-bl-none border-2 border-ink bg-acid text-xs font-semibold text-on-acid shadow-md ${active ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none"} ${open ? "ring-2 ring-acid ring-offset-2 ring-offset-ink" : ""}`}
              onPointerDown={(e) => grab(e, c)}
              onPointerMove={move}
              onPointerUp={() => drop(c)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpenId(open ? null : c.id);
                if (e.key === "Delete" || e.key === "Backspace") remove(c.id);
              }}
              tabIndex={active ? 0 : -1}
              aria-label={`Comment ${i + 1}${c.text ? `: ${c.text}` : ""}`}
              title={active ? undefined : c.text}
            >
              {i + 1}
            </button>
            {active && !open && (
              <button
                type="button"
                className="absolute top-[-1.35rem] left-1 flex size-5 items-center justify-center rounded-full bg-ink text-paper opacity-0 shadow transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => remove(c.id)}
                aria-label={`Delete comment ${i + 1}`}
              >
                <X size={12} aria-hidden strokeWidth={3} />
              </button>
            )}
            {open && (
              <input
                autoFocus
                className={`absolute top-0 w-[min(18rem,60vw)] -translate-y-1/2 rounded-full border border-rule-strong bg-field px-4 py-2 text-sm text-ink shadow-lg outline-none focus:border-ink ${left ? "right-6" : "left-6"}`}
                placeholder="Add a comment…"
                maxLength={COMMENT_MAX}
                value={c.text}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => update(c.id, { text: e.target.value })}
                onBlur={close}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                  }
                }}
                aria-label={`Comment ${i + 1}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
