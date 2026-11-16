"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { PRODUCT_TITLES } from "@/content/navData";
import { wizard as w } from "@/content/quoteWizard";
import type * as Box from "@/lib/box";
import type { BoxConfig } from "@/lib/box";
import {
  EMPTY_DRAFT, NOT_SURE, prefillFromParams, validateStep,
  type Errors, type QuoteDraft,
} from "@/lib/quote";
import Field, { btnGhost, btnPrimary, inputCls } from "./Field";

const Later = dynamic(() => import("./QuoteLater"), { ssr: false, loading: () => <p className="text-[var(--muted)]">Loading…</p> }); // steps 2 to 5 load when the visitor leaves step 1

const DRAFT_KEY = "packnova.quote.draft.v1";
const STEP_FIELDS: Record<number, (keyof QuoteDraft)[]> = { 1: ["product", "l", "w", "h"], 2: ["quantity"], 4: ["name", "phone", "email"] };

const loadDraft = (): Partial<QuoteDraft> => {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<QuoteDraft>) : {};
  } catch {
    return {};
  }
};
const saveDraft = (d: QuoteDraft) => {
  try {
    const { company: _c, ...rest } = d; // eslint-disable-line @typescript-eslint/no-unused-vars
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
  } catch {}
};
const clearDraft = () => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {}
};

/** The five-step quote form. State is local; the draft is kept in this browser only and cleared after sending. */
export default function QuoteWizard() {
  const [draft, setDraft] = useState<QuoteDraft>(EMPTY_DRAFT);
  const [cfg, setCfg] = useState<BoxConfig | null>(null);
  const [box, setBox] = useState<typeof Box | null>(null);
  const [pageNote, setPageNote] = useState("");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [announce, setAnnounce] = useState("");
  const [ready, setReady] = useState(false);
  const startedAt = useRef(0);
  useEffect(() => { startedAt.current = Date.now(); }, []); // when the visitor opened the page: the time-to-fill check of submitQuote
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sentRef = useRef(false);

  // prefill: the URL (product pages, the configurator) wins over an older draft; contact details always come back from the draft.
  // The configurator's size tables (lib/box) are only downloaded when the URL carries a design from it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const old = loadDraft();
    let dead = false;
    const apply = (pre: Partial<QuoteDraft>, c: BoxConfig | null, lib: typeof Box | null) => {
      if (dead) return;
      if (lib) setBox(lib);
      setCfg(c);
      setPageNote(!c && q.get("note") ? q.get("note")!.slice(0, 200) : "");
      setDraft({ ...EMPTY_DRAFT, ...old, ...(Object.keys(pre).length ? pre : {}), company: "", finishes: Array.isArray(old.finishes) ? old.finishes : [] });
      setReady(true);
    };
    if (q.get("cfg") === "1") {
      void Promise.all([import("@/lib/box"), import("@/lib/quoteBuild")]).then(([lib, build]) => {
        const c = lib.paramsToConfig(q);
        apply({ ...prefillFromParams(q), ...(c ? build.prefillFromConfig(c) : {}) }, c, lib);
      });
    } else apply(prefillFromParams(q), null, null);
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (!ready || sentRef.current) return;
    const t = setTimeout(() => saveDraft(draft), 400);
    return () => clearTimeout(t);
  }, [draft, ready]);

  const set = useCallback(<K extends keyof QuoteDraft>(k: K, v: QuoteDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  }, []);

  const goTo = (n: number) => {
    setStep(n);
    setErrors({});
    setAnnounce("");
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    const err = validateStep(step, draft);
    const keys = Object.keys(err) as (keyof QuoteDraft)[];
    if (keys.length) {
      setErrors(err);
      setAnnounce(`${keys.length === 1 ? "There is 1 thing" : `There are ${keys.length} things`} to check before you continue: ${keys.map((k) => err[k]).join(" ")}`);
      const first = STEP_FIELDS[step]?.find((k) => err[k]);
      if (first) requestAnimationFrame(() => document.getElementById(`q-${first}`)?.focus());
      return;
    }
    goTo(step + 1);
  };

  const products = useMemo(() => {
    const titles = new Set(PRODUCT_TITLES.flatMap((g) => g.titles));
    return draft.product && draft.product !== NOT_SURE && !titles.has(draft.product) && !cfg ? [draft.product] : [];
  }, [draft.product, cfg]);

  const validateAll = () => {
    for (const s of [1, 2, 4]) {
      const err = validateStep(s, draft);
      if (Object.keys(err).length) {
        setErrors(err);
        setAnnounce(`Step ${s} needs a change: ${Object.values(err).join(" ")}`);
        setStep(s);
        return false;
      }
    }
    return true;
  };
  const onSent = () => {
    sentRef.current = true;
    clearDraft();
  };

  const configuratorHref = cfg && box ? `/configurator/?${(() => { const q = box.configToParams(cfg); q.delete("note"); q.delete("product"); return q.toString(); })()}` : "/configurator/";

  return (
    <div>
      <p className="text-lg text-[var(--muted)]">{w.lead}</p>
      <div className="mt-6" aria-label="Progress">
        <p className="text-sm font-semibold">Step {step} of 5: {w.steps[step - 1]}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--wash)]"><div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300" style={{ width: `${(step / 5) * 100}%` }} /></div>
        <ol className="mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-sm sm:flex">
          {w.steps.map((s, i) => (
            <li key={s} aria-current={i + 1 === step ? "step" : undefined} className={i + 1 === step ? "font-semibold" : "text-[var(--muted)]"}>
              {i + 1 < step ? <button type="button" onClick={() => goTo(i + 1)} className="underline underline-offset-4">{i + 1}. {s}</button> : <>{i + 1}. {s}</>}
            </li>
          ))}
        </ol>
      </div>

      <div role="status" aria-live="polite" className={announce ? "mt-4 rounded-[var(--r-field)] border border-[#a2392b] bg-[var(--wash)] px-4 py-3 text-sm font-semibold text-[#a2392b]" : "sr-only"}>{announce}</div>

      <form onSubmit={next} noValidate className="mt-6 grid gap-5 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7" aria-labelledby="q-heading">
        <h2 id="q-heading" ref={headingRef} tabIndex={-1} className="font-display text-2xl font-medium outline-none">{step}. {w.steps[step - 1]}</h2>
        {/* honeypot: not for people (off-screen, skipped by keyboard and screen readers) */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Company website<input type="text" name="company" tabIndex={-1} autoComplete="off" value={draft.company} onChange={(e) => set("company", e.target.value)} /></label>
        </div>

        {step === 1 && (
          cfg && box ? (
            <div>
              <p className="text-sm text-[var(--muted)]">From your design in the configurator:</p>
              <table className="mt-2 w-full text-left text-[0.95rem]"><tbody>
                {box.summaryLines(cfg).filter(([k]) => k !== "Price").map(([k, v]) => <tr key={k} className="border-t border-[var(--line)]"><th scope="row" className="w-2/5 py-2 pr-3 align-top font-semibold">{k}</th><td className="py-2">{v}</td></tr>)}
              </tbody></table>
              <Link href={configuratorHref} className={`${btnGhost} mt-4`}>Change in configurator</Link>
            </div>
          ) : (
            <>
              {pageNote && <p className="rounded-[var(--r-field)] bg-[var(--wash)] px-3 py-2 text-sm">From the page you came from: {pageNote}</p>}
              <Field id="q-product" label="What do you need?" required error={errors.product}>
                {(p) => (
                  <select {...p} className={inputCls} value={draft.product} onChange={(e) => set("product", e.target.value)}>
                    <option value="">Choose a product</option>
                    <option value={NOT_SURE}>{NOT_SURE}: help me choose</option>
                    {products.map((x) => <option key={x}>{x}</option>)}
                    {PRODUCT_TITLES.map((g) => <optgroup key={g.group} label={g.group}>{g.titles.map((t) => <option key={t}>{t}</option>)}</optgroup>)}
                  </select>
                )}
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Size, if you know it (optional)</legend>
                <div className="grid grid-cols-3 gap-3">
                  {(["l", "w", "h"] as const).map((k, i) => (
                    <Field key={k} id={`q-${k}`} label={["Length", "Width", "Height"][i]} error={errors[k]}>
                      {(p) => <input {...p} className={inputCls} inputMode="decimal" value={draft[k]} onChange={(e) => set(k, e.target.value)} />}
                    </Field>
                  ))}
                </div>
                <div className="mt-2 flex gap-4 text-sm" role="radiogroup" aria-label="Unit">
                  {(["cm", "in"] as const).map((u) => <label key={u} className="flex items-center gap-2"><input type="radio" name="unit" checked={draft.unit === u} onChange={() => set("unit", u)} className="accent-[var(--accent)]" />{u === "cm" ? "Centimetres" : "Inches"}</label>)}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">Not sure? <Link href="/configurator/" className="underline underline-offset-4">Design your box</Link> and it fills this in for you.</p>
              </fieldset>
            </>
          )
        )}

        {step > 1 && <Later step={step} draft={draft} set={set} errors={errors} cfg={cfg} configuratorHref={configuratorHref} startedAt={() => startedAt.current} validateAll={validateAll} onSent={onSent} goTo={goTo} />}

        {step < 5 && (
          <div className="flex flex-wrap items-center gap-3">
            {step > 1 && <button type="button" onClick={() => goTo(step - 1)} className={btnGhost}>Back</button>}
            <button type="submit" className={btnPrimary}>{step === 4 ? "Review" : "Next"}</button>
          </div>
        )}
        {step === 5 && <div><button type="button" onClick={() => goTo(4)} className={btnGhost}>Back</button></div>}
      </form>
    </div>
  );
}
