"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { wizard as w } from "@/content/quoteWizard";
import { MATERIALS, TYPE_BY_ID, type BoxConfig } from "@/lib/box";
import { CONTACT_LABEL, COUNTRY_CODES, FINISHES, normalizePhone, type Contact, type Errors, type QuoteDraft } from "@/lib/quote";
import { MATERIAL_CHOICES, buildQuoteMessage } from "@/lib/quoteBuild";
import { QUOTE_ENDPOINT, type QuotePayload } from "@/lib/submitQuote";
import Field, { inputCls } from "./Field";

const SendActions = dynamic(() => import("./SendActions"), { ssr: false, loading: () => <p className="text-[var(--muted)]">Loading the send buttons…</p> }); // loads only when the review step opens

export interface LaterProps {
  step: number;
  draft: QuoteDraft;
  set: <K extends keyof QuoteDraft>(k: K, v: QuoteDraft[K]) => void;
  errors: Errors;
  cfg: BoxConfig | null;
  configuratorHref: string;
  startedAt: () => number;
  validateAll: () => boolean;
  onSent: () => void;
  goTo: (n: number) => void;
}

/** Steps 2 to 5 of the quote form. A separate chunk: the page itself only ships step 1 (and the shell) in its first load. */
export default function Later({ step, draft, set, errors, cfg, configuratorHref, startedAt, validateAll, onSent, goTo }: LaterProps) {
  const message = buildQuoteMessage(draft, cfg);
  const payload = (): QuotePayload => ({
    message,
    name: draft.name.trim(),
    phone: normalizePhone(draft.phone, draft.code) ?? draft.phone,
    email: draft.email.trim(),
    fields: { product: cfg ? TYPE_BY_ID[cfg.type].label : draft.product, quantity: draft.quantity, contact_method: CONTACT_LABEL[draft.contact], city: draft.city, country: draft.country },
    _gotcha: draft.company,
  });
  return (
    <>
        {step === 2 && (
          <>
            {cfg ? (
              <p className="text-[0.95rem]">Material and finishes come from your design: <strong>{MATERIALS[cfg.material].label}</strong>. <Link href={configuratorHref} className="underline underline-offset-4">Change in configurator</Link></p>
            ) : (
              <>
                <Field id="q-material" label="Material" hint="Choose what you think suits you. We confirm it with the quote.">
                  {(p) => (
                    <select {...p} className={inputCls} value={draft.material} onChange={(e) => set("material", e.target.value)}>
                      <option value="">No preference</option>
                      {MATERIAL_CHOICES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  )}
                </Field>
                <fieldset>
                  <legend className="mb-1.5 text-sm font-semibold">Finishes (optional)</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FINISHES.map((f) => (
                      <label key={f} className="flex items-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] px-3 py-2.5 has-[:checked]:border-[var(--accent)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent)]">
                        <input type="checkbox" checked={draft.finishes.includes(f)} onChange={(e) => set("finishes", e.target.checked ? [...draft.finishes, f] : draft.finishes.filter((x) => x !== f))} className="accent-[var(--accent)]" />{f}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <Field id="q-quantity" label="Quantity" required error={errors.quantity} hint="How many pieces you need. A rough number is fine.">
              {(p) => <input {...p} className={inputCls} inputMode="numeric" value={draft.quantity} onChange={(e) => set("quantity", e.target.value.replace(/[,\s]/g, ""))} />}
            </Field>
            <p className="text-sm text-[var(--muted)]">{w.noPriceNote}</p>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-[0.95rem]">{w.artwork}</p>
            <Field id="q-artwork" label="Notes about your artwork (optional)" hint="For example: I have a logo, I need help with the design, or the colours I want.">
              {(p) => <textarea {...p} className={inputCls} rows={4} maxLength={1000} value={draft.artwork} onChange={(e) => set("artwork", e.target.value)} />}
            </Field>
          </>
        )}

        {step === 4 && (
          <>
            <Field id="q-name" label="Your name" required error={errors.name}>
              {(p) => <input {...p} className={inputCls} autoComplete="name" value={draft.name} onChange={(e) => set("name", e.target.value)} />}
            </Field>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,13rem)_1fr]">
              <Field id="q-code" label="Country code">
                {(p) => (
                  <select {...p} className={inputCls} value={draft.code} onChange={(e) => set("code", e.target.value)} autoComplete="tel-country-code">
                    {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                )}
              </Field>
              <Field id="q-phone" label="Phone or WhatsApp number" required error={errors.phone} hint="Digits, spaces, + and dashes are fine. A number with + and its own country code is used as it is.">
                {(p) => <input {...p} className={inputCls} type="tel" inputMode="tel" autoComplete="tel-national" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />}
              </Field>
            </div>
            <Field id="q-email" label="Email" error={errors.email} hint="Optional, unless you want us to reply by email.">
              {(p) => <input {...p} className={inputCls} type="email" autoComplete="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />}
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="q-city" label="City">{(p) => <input {...p} className={inputCls} autoComplete="address-level2" value={draft.city} onChange={(e) => set("city", e.target.value)} />}</Field>
              <Field id="q-country" label="Country">{(p) => <input {...p} className={inputCls} autoComplete="country-name" value={draft.country} onChange={(e) => set("country", e.target.value)} />}</Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold">How should we contact you?</legend>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(CONTACT_LABEL) as Contact[]).map((c) => (
                  <label key={c} className="flex items-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] px-3 py-2.5 has-[:checked]:border-[var(--accent)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent)]">
                    <input type="radio" name="contact" checked={draft.contact === c} onChange={() => set("contact", c)} className="accent-[var(--accent)]" />{CONTACT_LABEL[c]}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 5 && (
          <>
            <p className="text-[0.95rem]">Please check your request. Use the step list or the buttons to change anything.</p>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--wash)] p-4 font-sans text-[0.95rem]" data-testid="quote-message">{message}</pre>
            <div className="flex flex-wrap gap-2 text-sm">
              {[1, 2, 3, 4].map((n) => <button key={n} type="button" onClick={() => goTo(n)} className="underline underline-offset-4">Edit: {w.steps[n - 1]}</button>)}
            </div>
            <SendActions text={message} payload={payload} startedAt={() => startedAt()} validate={validateAll} onSent={onSent} />
            <p className="text-sm text-[var(--muted)]" data-testid="privacy"><strong>{w.privacy.title}.</strong> {w.privacy.sent}{QUOTE_ENDPOINT ? w.privacy.sentForm : ""}{w.privacy.stored}</p>
          </>
        )}

    </>
  );
}
