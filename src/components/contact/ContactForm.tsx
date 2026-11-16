"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { contactPage as c } from "@/content/contactPage";
import { wizard } from "@/content/quoteWizard";
import Field, { inputCls } from "@/components/quote/Field";
const SendActions = dynamic(() => import("@/components/quote/SendActions"), { ssr: false, loading: () => <p className="text-[var(--muted)]">Loading the send buttons…</p> });
import { COUNTRY_CODES, EMPTY_DRAFT, normalizePhone, validateContact, type Errors, type QuoteDraft } from "@/lib/quote";
import { buildContactMessage } from "@/lib/quoteBuild";
import { QUOTE_ENDPOINT, type QuotePayload } from "@/lib/submitQuote";

type F = Pick<QuoteDraft, "name" | "code" | "phone" | "email" | "artwork" | "company">;

/** The short contact form: the same validation, message builder and sending as the quote wizard. */
export default function ContactForm() {
  const [d, setD] = useState<F>({ name: EMPTY_DRAFT.name, code: EMPTY_DRAFT.code, phone: "", email: "", artwork: "", company: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [announce, setAnnounce] = useState("");
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []); // when the visitor opened the page: the time-to-fill check of submitQuote
  const set = <K extends keyof F>(k: K, v: F[K]) => { setD((x) => ({ ...x, [k]: v })); setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e)); };
  const text = buildContactMessage(d);
  const validate = () => {
    const err = validateContact(d);
    const keys = Object.keys(err) as (keyof F)[];
    setErrors(err);
    if (!keys.length) { setAnnounce(""); return true; }
    setAnnounce(`${keys.length === 1 ? "There is 1 thing" : `There are ${keys.length} things`} to check: ${keys.map((k) => err[k]).join(" ")}`);
    const first = (["name", "phone", "email", "artwork"] as const).find((k) => err[k]);
    if (first) requestAnimationFrame(() => document.getElementById(`c-${first}`)?.focus());
    return false;
  };
  const payload = (): QuotePayload => ({ message: text, name: d.name.trim(), phone: normalizePhone(d.phone, d.code) ?? d.phone, email: d.email.trim(), fields: { kind: "contact" }, _gotcha: d.company });
  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} aria-labelledby="contact-form-h" className="grid gap-4 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
      <h2 id="contact-form-h" className="font-display text-2xl font-medium">{c.formHeading}</h2>
      <p className="text-[var(--muted)]">{c.formLead}</p>
      <div role="status" aria-live="polite" className={announce ? "rounded-[var(--r-field)] border border-[#a2392b] bg-[var(--wash)] px-4 py-3 text-sm font-semibold text-[#a2392b]" : "sr-only"}>{announce}</div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Company website<input type="text" tabIndex={-1} autoComplete="off" value={d.company} onChange={(e) => set("company", e.target.value)} /></label></div>
      <Field id="c-name" label="Your name" required error={errors.name}>{(p) => <input {...p} className={inputCls} autoComplete="name" value={d.name} onChange={(e) => set("name", e.target.value)} />}</Field>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,13rem)_1fr]">
        <Field id="c-code" label="Country code">
          {(p) => <select {...p} className={inputCls} value={d.code} onChange={(e) => set("code", e.target.value)}>{COUNTRY_CODES.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}</select>}
        </Field>
        <Field id="c-phone" label="Phone or WhatsApp" error={errors.phone} hint="Add a phone number or an email address, so we can reply.">
          {(p) => <input {...p} className={inputCls} type="tel" inputMode="tel" autoComplete="tel-national" value={d.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
      </div>
      <Field id="c-email" label="Email" error={errors.email}>{(p) => <input {...p} className={inputCls} type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} />}</Field>
      <Field id="c-artwork" label="Your message" required error={errors.artwork}>{(p) => <textarea {...p} className={inputCls} rows={4} maxLength={1500} value={d.artwork} onChange={(e) => set("artwork", e.target.value)} />}</Field>
      <SendActions text={text} payload={payload} startedAt={() => startedAt.current} validate={validate} onSent={() => {}} />
      <p className="text-sm text-[var(--muted)]"><strong>{wizard.privacy.title}.</strong> {wizard.privacy.sent}{QUOTE_ENDPOINT ? wizard.privacy.sentForm : ""}. This website does not store it.</p>
    </form>
  );
}
