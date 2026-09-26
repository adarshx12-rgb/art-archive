import { Bookmark, BookmarkCheck, Copy } from "lucide-react";
import { copyText } from "../lib/clipboard";
import { useSaved } from "../state/saved";
import { useToast } from "../state/toast";

interface SaveProps {
  kind: "styles" | "palettes";
  slug: string;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/** Toggle button. State is conveyed by aria-pressed, icon shape and text — not colour alone. */
export function SaveButton({ kind, slug, label, size = "md", className = "" }: SaveProps) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(kind, slug);
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle(kind, slug, label)}
      className={`btn ${size === "sm" ? "btn-sm" : ""} ${saved ? "btn-primary" : "btn-ghost"} ${className}`}
    >
      <Icon size={size === "sm" ? 14 : 16} aria-hidden />
      {saved ? "Saved" : "Save"}
      <span className="sr-only"> {label}</span>
    </button>
  );
}

interface CopyProps {
  text: string;
  /** What is being copied, for the confirmation message. */
  what: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  variant?: "primary" | "ghost";
  onFail?: () => void;
}

export function CopyButton({ text, what, children, className = "", size = "md", variant = "ghost", onFail }: CopyProps) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={`btn ${size === "sm" ? "btn-sm" : ""} ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) toast(`Copied ${what}`);
        else {
          toast(`Couldn’t copy automatically. Select the text and copy it manually.`, "error");
          onFail?.();
        }
      }}
    >
      <Copy size={size === "sm" ? 14 : 16} aria-hidden />
      {children ?? "Copy"}
    </button>
  );
}
