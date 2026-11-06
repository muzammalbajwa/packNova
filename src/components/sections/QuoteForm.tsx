"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";

const f = site.quote.fields;
const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

/**
 * Front-end only for now.
 * TODO(backend): POST the fields to a form service / Cloudflare Pages Function / email API.
 */
export default function QuoteForm() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="rounded-3xl bg-black p-8 text-[var(--fg)] md:p-10">
        <p className="font-display text-3xl font-bold tracking-tight">{site.quote.success.title}</p>
        <p className="mt-3 text-[var(--muted)]">{site.quote.success.body}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full border border-white/20 px-5 py-2.5 text-sm transition-colors hover:border-[var(--fg)]"
        >
          {site.quote.success.again}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl bg-black p-6 text-[var(--fg)] md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.name}</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.phone}</span>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.product}</span>
          <select name="product" required defaultValue="" className={field}>
            <option value="" disabled className="bg-black">
              {f.productPlaceholder}
            </option>
            {site.products.items.map((p) => (
              <option key={p.id} value={p.name} className="bg-black">
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.quantity}</span>
          <input name="quantity" type="number" min={1} inputMode="numeric" required className={field} />
        </label>
      </div>
      <label>
        <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.message}</span>
        <textarea name="message" rows={4} className={field} />
      </label>
      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-8 py-4 text-base font-medium text-black transition-colors duration-300 hover:bg-[var(--fg)]"
      >
        {site.quote.submit}
      </button>
    </form>
  );
}
