"use client";

import { useEffect, useState, type FormEvent } from "react";
import { site } from "@/content/site";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/track";
import { buildQuoteText, whatsappUrl } from "@/lib/quoteMessage";
import QuoteHandoff from "../ui/QuoteHandoff";

const f = site.quote.fields;
const field =
  "w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] px-4 py-3 text-base text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

/**
 * Four essentials (name, phone, what you are packing, quantity) plus an optional message.
 * No backend: a valid submit opens a prefilled WhatsApp chat (and offers an email fallback).
 * Nothing is sent until the visitor presses send there. A CTA elsewhere on the page ("Want this
 * box?", a product card) can hand over a product and note through the store (`quotePrefill`).
 * TODO(form-service): replace/augment with a real form service (e.g. Cloudflare Pages Function,
 * Formspree, or an email API) so requests are captured without relying on WhatsApp.
 */
export default function QuoteForm() {
  const prefill = useAppStore((s) => s.quotePrefill);
  const [text, setText] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({}); // kept so "Edit request" does not lose input

  // /quote/?product=...&note=... (product pages and the configurator link here) fills the form
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const product = q.get("product") ?? undefined;
    const note = q.get("note") ?? undefined;
    if (product || note) useAppStore.getState().setQuotePrefill({ product, note });
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "");
    const input = { name: get("name"), phone: get("phone"), product: get("product"), quantity: get("quantity"), message: get("message") };
    const msg = buildQuoteText(input);
    setVals(input);
    setText(msg);
    track("quote_form_submit", { product: input.product });
    // Inside the submit gesture, so popup blockers allow it; the link below is the fallback.
    window.open(whatsappUrl(msg), "_blank", "noopener,noreferrer");
  };

  if (text) return <QuoteHandoff text={text} onEdit={() => setText(null)} />;

  const product = vals.product ?? prefill?.product ?? "";
  const message = vals.message ?? prefill?.note ?? "";

  return (
    // key: starting from a different prefill remounts the fields so their defaults apply
    <form
      key={`${prefill?.product ?? ""}|${prefill?.note ?? ""}`}
      onSubmit={onSubmit}
      className="grid gap-4 rounded-[var(--r-card)] bg-[var(--surface)] p-6 text-[var(--fg)] md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.name}</span>
          <input name="name" required autoComplete="name" defaultValue={vals.name ?? ""} className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.phone}</span>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" defaultValue={vals.phone ?? ""} className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.product}</span>
          <select name="product" required defaultValue={product} className={field}>
            <option value="" disabled>
              {f.productPlaceholder}
            </option>
            {[...new Set([...site.products.items.map((p) => p.name), ...(product ? [product] : [])])].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.quantity}</span>
          <input name="quantity" type="number" min={1} inputMode="numeric" required defaultValue={vals.quantity ?? ""} className={field} />
        </label>
      </div>
      <label>
        <span className="mb-1.5 block text-xs text-[var(--muted)]">{f.message}</span>
        <textarea name="message" rows={2} defaultValue={message} className={field} />
      </label>
      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-8 py-4 text-base font-medium text-[var(--on-accent)] transition-colors duration-300 hover:bg-[var(--fg)]"
      >
        {site.quote.submit}
      </button>
    </form>
  );
}
