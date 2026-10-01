import { Link } from "react-router";
import { useMeta } from "../lib/useMeta";

interface Props {
  title: string;
  message: React.ReactNode;
  suggestions?: { to: string; label: string }[];
  suggestionsLabel?: string;
  actions?: { to: string; label: string }[];
}

/** Friendly recovery screen for unknown routes and slugs. */
export function Recovery({ title, message, suggestions = [], suggestionsLabel = "Did you mean", actions = [] }: Props) {
  useMeta(title, typeof message === "string" ? message : title);
  return (
    <div className="wrap py-16 sm:py-24">
      <p className="meta text-muted">Not found</p>
      <h1 className="mt-3 max-w-4xl font-display text-h1 font-semibold">{title}</h1>
      <div className="mt-4 max-w-xl text-lg text-muted">{message}</div>
      {suggestions.length > 0 && (
        <div className="mt-10">
          <h2 className="meta text-muted">{suggestionsLabel}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s.to}>
                <Link to={s.to} className="chip text-base">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-2">
        {actions.map((a, i) => (
          <Link key={a.to} to={a.to} className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
