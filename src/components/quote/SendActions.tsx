"use client";

import { useRef, useState } from "react";
import { wizard } from "@/content/quoteWizard";
import { mailtoLink, whatsappLink } from "@/lib/quoteBuild";
import { QUOTE_ENDPOINT, submitQuote, type QuotePayload } from "@/lib/submitQuote";
import { btnGhost, btnPrimary } from "./Field";

type State = "idle" | "sending" | "success" | "error" | "too-fast";

/**
 * The ways to send: WhatsApp and email always (they use the same `text`), and "Send request" only when a form service is
 * connected (NEXT_PUBLIC_QUOTE_ENDPOINT). `validate` runs first; when it says no, nothing opens or is sent.
 */
export default function SendActions({ text, payload, startedAt, validate, onSent }: { text: string; payload: () => QuotePayload; startedAt: () => number; validate?: () => boolean; onSent: () => void }) {
  const [state, setState] = useState<State>("idle");
  const busy = useRef(false);
  const w = wizard;
  const guard = (e: React.MouseEvent) => {
    if (validate && !validate()) e.preventDefault();
    else onSent();
  };
  const send = async () => {
    if (busy.current || (validate && !validate())) return;
    busy.current = true;
    setState("sending");
    const r = await submitQuote(payload(), { elapsedMs: Date.now() - startedAt() });
    busy.current = false;
    if (r.ok) { setState("success"); onSent(); }
    else setState(r.reason === "too-fast" ? "too-fast" : "error");
  };
  if (state === "success")
    return (
      <div role="status" className="rounded-[var(--r-card)] border border-[var(--accent)] bg-[var(--wash)] p-5">
        <p className="font-display text-2xl font-medium">{w.success.title}</p>
        <p className="mt-2">{w.success.body}</p>
        <a href={whatsappLink("Hello, I have just sent a quote request and would like to send my artwork.")} target="_blank" rel="noopener noreferrer" className={`${btnGhost} mt-4`}>Send artwork on WhatsApp</a>
      </div>
    );
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {QUOTE_ENDPOINT && <button type="button" onClick={send} disabled={state === "sending"} className={btnPrimary}>{state === "sending" ? "Sending…" : "Send request"}</button>}
        <a href={whatsappLink(text)} onClick={guard} target="_blank" rel="noopener noreferrer" className={QUOTE_ENDPOINT ? btnGhost : btnPrimary}>Send on WhatsApp</a>
        <a href={mailtoLink(text)} onClick={guard} className={btnGhost}>Send by email</a>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">WhatsApp and your email app open with the message ready. Nothing is sent until you press send there.</p>
      <p role="status" aria-live="polite" className="mt-2 text-sm font-semibold text-[#a2392b]">{state === "error" ? w.error : state === "too-fast" ? w.tooFast : ""}</p>
    </div>
  );
}
