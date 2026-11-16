import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] px-3 py-2.5 text-base text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] aria-[invalid=true]:border-[#a2392b]";
export const btnPrimary = "inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--on-accent)] hover:bg-[var(--fg)] disabled:opacity-60";
export const btnGhost = "inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--line-strong)] px-6 py-3 text-base font-semibold hover:border-[var(--fg)]";

interface InputProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
}

/** A label tied to its control, a hint, and an inline error that the control points at (aria-describedby) so it is read out with it. */
export default function Field({ id, label, error, hint, required, children }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: (p: InputProps) => ReactNode }) {
  const d = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required ? <span className="font-normal text-[var(--muted)]"> (required)</span> : null}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": d, "aria-required": required ? true : undefined })}
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-[var(--muted)]">{hint}</p>}
      {error && <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-[#a2392b]">{error}</p>}
    </div>
  );
}
