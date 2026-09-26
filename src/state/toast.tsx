import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleAlert } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  tone: "ok" | "error";
}

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/**
 * Short confirmations ("Copied", "Saved"). Messages are announced through a
 * persistent polite live region so screen readers hear them.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);

  const show = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    window.clearTimeout(timer.current);
    seq.current += 1;
    setToast({ id: seq.current, message, tone });
    timer.current = window.setTimeout(() => setToast(null), tone === "error" ? 6000 : 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:justify-start sm:px-6"
      >
        {toast && (
          <p
            key={toast.id}
            className={`enter pointer-events-auto flex max-w-md items-center gap-2 rounded-[2px] border px-4 py-3 text-sm shadow-[0_1px_0_rgba(0,0,0,0.08)] ${
              toast.tone === "error" ? "border-alert bg-paper text-alert" : "border-ink bg-ink text-paper"
            }`}
          >
            {toast.tone === "error" ? (
              <CircleAlert size={16} aria-hidden />
            ) : (
              <Check size={16} aria-hidden />
            )}
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
