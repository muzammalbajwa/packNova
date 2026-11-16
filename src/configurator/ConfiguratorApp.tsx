"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import ProductPoster from "@/catalog/ProductPoster";
import type { CatalogPage } from "@/content/catalog";
import type { Engine } from "@/film/engine";
import { loadEngine, waitForOtherContexts } from "@/film/loaders";
import type { Preview } from "@/film/configurator";
import {
  ARTWORK_NOTE, MATERIALS, PALETTE, PRINT_LABEL, QUANTITIES, TYPES, TYPE_BY_ID, boxSkin, clampDims, configToParams, defaultColor, defaultConfig, describe, fmt, fromUnit,
  isHex, paramsToConfig, previewRatio, summaryLines, toUnit, withType, type BoxConfig, type PrintArea, type Unit,
} from "@/lib/box";
import { detectDevice } from "@/lib/deviceTier";
import { useDebouncedValue } from "@/lib/useDebounced";

const Dieline = dynamic(() => import("./DielineView"), { ssr: false, loading: () => <p className="text-[var(--muted)]">Drawing the dieline…</p> });

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const field = "w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] px-3 py-2.5 text-base text-[var(--fg)] outline-none focus:border-[var(--accent)]";
const legend = "font-display mb-2 text-lg font-medium";
const choice = "flex cursor-pointer items-center gap-2 rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[0.95rem] has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--wash)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]";

/** Where each dimension label sits relative to its point on the box: below the front edge, below the side edge, beside the vertical edge. */
const LABEL_SHIFT = ["-translate-x-1/2 translate-y-2", "-translate-x-1/4 translate-y-2", "translate-x-2 -translate-y-1/2"];

type Logo = { canvas: HTMLCanvasElement; name: string };

/** Size: a number box and a slider for one side, in the chosen unit. Typing is only clamped when the box is left. */
function Dim({ id, label, cm, range, unit, onChange }: { id: string; label: string; cm: number; range: [number, number]; unit: Unit; onChange: (cm: number) => void }) {
  const [txt, setTxt] = useState(fmt(cm, unit));
  const focus = useRef(false);
  useEffect(() => {
    if (!focus.current) setTxt(fmt(cm, unit)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [cm, unit]);
  const step = unit === "in" ? 0.25 : 0.5;
  return (
    <div className="grid grid-cols-[5.5rem_1fr_5.5rem] items-center gap-3">
      <label htmlFor={id} className="text-sm font-semibold">{label} ({unit})</label>
      <input
        type="range" aria-label={`${label} slider`} min={toUnit(range[0], unit)} max={toUnit(range[1], unit)} step={step} value={toUnit(cm, unit)}
        onChange={(e) => onChange(fromUnit(Number(e.target.value), unit))} className="w-full accent-[var(--accent)]"
      />
      <input
        id={id} type="number" inputMode="decimal" className={field} value={txt} step={step} min={toUnit(range[0], unit)} max={toUnit(range[1], unit)}
        onFocus={() => (focus.current = true)}
        onChange={(e) => { setTxt(e.target.value); const n = parseFloat(e.target.value); if (Number.isFinite(n)) onChange(fromUnit(n, unit)); }}
        onBlur={() => { focus.current = false; setTxt(fmt(cm, unit)); }}
      />
    </div>
  );
}

export default function ConfiguratorApp() {
  const [cfg, setCfg] = useState<BoxConfig>(() => defaultConfig());
  const [logo, setLogo] = useState<Logo | null>(null);
  const [logoErr, setLogoErr] = useState("");
  const [fold, setFold] = useState(1);
  const [gl, setGl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [booted, setBooted] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<Engine | null>(null);
  const modRef = useRef<typeof import("@/film/configurator") | null>(null);
  const previewRef = useRef<{ pv: Preview; type: string } | null>(null);
  const foldRef = useRef(1);
  const buildId = useRef(0);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lowRef = useRef(false);
  const reducedRef = useRef(false);

  const set = useCallback((patch: Partial<BoxConfig>) => setCfg((c) => ({ ...c, ...patch })), []);
  const setDim = useCallback((k: "l" | "w" | "h", cm: number) => setCfg((c) => ({ ...c, ...clampDims(c.type, { l: c.l, w: c.w, h: c.h, [k]: cm }) })), []);
  const t = TYPE_BY_ID[cfg.type];

  // arriving from the quote page ("Change in configurator") or a shared link: start from the design in the URL
  useEffect(() => {
    const c = paramsToConfig(new URLSearchParams(window.location.search));
    if (c) setCfg(c); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // 3D: its own chunks, started in idle time; the film renderer and the recipe code are shared with the product pages
  useEffect(() => {
    const prof = detectDevice();
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    lowRef.current = prof.tier === "low";
    if (!prof.webgl) { setGl(false); return; } // eslint-disable-line react-hooks/set-state-in-effect
    setGl(true);
    let dead = false;
    const start = async () => {
      const [{ getEngine }, mod] = await Promise.all([loadEngine(), import("@/film/configurator"), waitForOtherContexts()]);
      if (dead || !hostRef.current) return;
      const eng = getEngine();
      eng.attach(hostRef.current, prof.dpr[1]);
      eng.firstFrame = () => setReady(true);
      eng.onLost = () => setReady(false);
      eng.onRestored = () => { eng.firstFrame = () => setReady(true); };
      eng.setProgress(foldRef.current);
      engRef.current = eng;
      modRef.current = mod;
      setBooted(true);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
    const ric = typeof w.requestIdleCallback === "function";
    const h = ric ? w.requestIdleCallback!(() => void start(), { timeout: 1200 }) : window.setTimeout(() => void start(), 150);
    return () => {
      dead = true;
      if (ric) w.cancelIdleCallback?.(h);
      else window.clearTimeout(h);
      previewRef.current = null;
      engRef.current?.detach();
      engRef.current = null;
    };
  }, []);

  // rebuild the box only after the inputs have been still for a moment
  const settled = useDebouncedValue(cfg, 160);
  useEffect(() => {
    const eng = engRef.current;
    const mod = modRef.current;
    if (!booted || !eng || !mod) return;
    const id = ++buildId.current;
    void (async () => {
      const labels = (i: number, x: number, y: number, on: boolean) => {
        const el = labelRefs.current[i];
        if (!el) return;
        el.style.left = `${x.toFixed(1)}%`;
        el.style.top = `${y.toFixed(1)}%`;
        el.style.opacity = on ? "1" : "0";
      };
      const t0 = performance.now();
      const pv = await mod.createPreview(settled, { low: lowRef.current, logo: logo?.canvas, reduced: reducedRef.current, request: () => engRef.current?.request(), labels });
      if (id !== buildId.current || engRef.current !== eng) { pv.instance.dispose(); return; }
      previewRef.current = { pv, type: settled.type };
      const t1 = performance.now();
      await eng.mount(pv.instance);
      (window as unknown as { __cfgBuild?: { build: number; mount: number }[] }).__cfgBuild?.push({ build: t1 - t0, mount: performance.now() - t1 }); // ?perf timing for the tests
    })();
  }, [booted, settled, logo]);

  // instant feedback while a size moves: scale the built model, the exact rebuild follows after the pause
  useEffect(() => {
    const cur = previewRef.current;
    if (cur && cur.type === cfg.type) cur.pv.scaleHint(previewRatio(cfg));
  }, [cfg]);

  const onFold = (v: number) => {
    foldRef.current = v;
    setFold(v);
    engRef.current?.setProgress(v);
  };

  // drag to rotate, double tap or double click to reset, arrow keys as well
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const lastTap = useRef(0);
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    previewRef.current?.pv.nudge(dx * 0.008, dy * 0.006);
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved < 6) {
      const now = performance.now();
      if (now - lastTap.current < 320) previewRef.current?.pv.resetView();
      lastTap.current = now;
    }
  };
  const key = (e: React.KeyboardEvent) => {
    const pv = previewRef.current?.pv;
    if (!pv) return;
    const m: Record<string, [number, number]> = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    if (m[e.key]) { e.preventDefault(); pv.nudge(...m[e.key]); }
    else if (e.key === "Home" || e.key === "0") pv.resetView();
  };

  const onLogo = useCallback((file: File | undefined) => {
    setLogoErr("");
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) { setLogoErr("Use a PNG, JPG, WebP, GIF or SVG image."); return; }
    if (file.size > MAX_LOGO_BYTES) { setLogoErr("That file is over 2 MB. Please use a smaller image."); return; }
    const url = URL.createObjectURL(file); // stays in this browser: nothing is uploaded
    const img = new Image();
    img.onload = () => {
      const w0 = img.naturalWidth || 512;
      const h0 = img.naturalHeight || 512;
      const f = Math.min(1, 1024 / Math.max(w0, h0));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w0 * f));
      canvas.height = Math.max(1, Math.round(h0 * f));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      setLogo({ canvas, name: file.name });
    };
    img.onerror = () => { URL.revokeObjectURL(url); setLogoErr("That image could not be read."); };
    img.src = url;
  }, []);

  // the poster (until the 3D is ready) and the summary follow the settled values, so a slider tick re-renders very little
  const posterPage = useMemo(() => ({ recipe: TYPE_BY_ID[settled.type].recipe, skin: boxSkin(settled), title: TYPE_BY_ID[settled.type].label, slug: "" }) as unknown as CatalogPage, [settled]);
  const lines = useMemo(() => summaryLines(settled), [settled]);
  const swatchHit = PALETTE.some((p) => p.hex === cfg.color);

  const productBlock = useMemo(
    () => (
        <fieldset>
            <legend className={legend}>1. Product</legend>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map((p) => (
                <label key={p.id} className={choice}>
                  <input type="radio" name="type" value={p.id} checked={cfg.type === p.id} onChange={() => setCfg((c) => withType(c, p.id))} className="accent-[var(--accent)]" />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">{t.hint}</p>
          </fieldset>
    ),
    [cfg.type], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const materialBlock = useMemo(
    () => (
        <fieldset>
            <legend className={legend}>3. Material</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {t.materials.map((m) => (
                <label key={m} className={choice}>
                  <input
                    type="radio" name="material" checked={cfg.material === m} className="accent-[var(--accent)]"
                    onChange={() => setCfg((c) => ({ ...c, material: m, color: c.color === defaultColor(c.material) ? defaultColor(m) : c.color }))}
                  />
                  <span>{MATERIALS[m].label}<span className="block text-xs text-[var(--muted)]">{MATERIALS[m].note}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
    ),
    [cfg.type, cfg.material], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const colourBlock = useMemo(
    () => (
        <fieldset>
            <legend className={legend}>4. Colour</legend>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((p) => (
                <label key={p.id} className={`${choice} gap-2`}>
                  <input type="radio" name="color" checked={cfg.color === p.hex} onChange={() => set({ color: p.hex })} className="accent-[var(--accent)]" />
                  <span aria-hidden className="h-5 w-5 rounded-full border border-[var(--line-strong)]" style={{ background: p.hex }} />
                  {p.label}
                </label>
              ))}
              <label className={`${choice} ${swatchHit ? "" : "border-[var(--accent)] bg-[var(--wash)]"}`}>
                Custom
                <input type="color" aria-label="Custom colour" value={cfg.color} onChange={(e) => set({ color: e.target.value })} className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0" />
                <input
                  aria-label="Custom colour as hex" className="w-24 rounded border border-[var(--line)] bg-[var(--field)] px-2 py-1 text-sm" value={cfg.color} maxLength={7} spellCheck={false}
                  onChange={(e) => { const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`; if (isHex(v)) set({ color: v.toLowerCase() }); }}
                />
              </label>
            </div>
          </fieldset>
    ),
    [cfg.color], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const printBlock = useMemo(
    () => (
        <fieldset>
            <legend className={legend}>5. Print</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(PRINT_LABEL) as PrintArea[]).map((a) => (
                <label key={a} className={choice}><input type="radio" name="print" checked={cfg.print === a} onChange={() => set({ print: a })} className="accent-[var(--accent)]" />{PRINT_LABEL[a]}</label>
              ))}
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Inside print is shown as a colour on the inner faces. Your logo is placed on the outside.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold" htmlFor="logo">Logo (optional)</label>
              <input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => { onLogo(e.target.files?.[0]); e.target.value = ""; }} className="max-w-full text-sm" />
              {logo && <button type="button" onClick={() => setLogo(null)} className="rounded-[var(--r-btn)] border border-[var(--line-strong)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--fg)]">Remove {logo.name.slice(0, 24)}</button>}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]" role="status">{logoErr ? <span className="font-semibold text-[#a2392b]">{logoErr}</span> : "PNG, JPG, WebP, GIF or SVG, up to 2 MB. It stays in your browser: nothing is uploaded."}</p>
          </fieldset>
    ),
    [cfg.print, logo, logoErr], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const finishBlock = useMemo(
    () => (
        <fieldset>
            <legend className={legend}>6. Finish</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["matte", "gloss"] as const).map((s) => (
                <label key={s} className={choice}><input type="radio" name="surface" checked={cfg.surface === s} onChange={() => set({ surface: s })} className="accent-[var(--accent)]" />{s === "matte" ? "Matte coating" : "Gloss coating"}</label>
              ))}
              <label className={choice}><input type="checkbox" checked={cfg.foil} onChange={(e) => set({ foil: e.target.checked })} className="accent-[var(--accent)]" />Foil on the print</label>
              <label className={choice}><input type="checkbox" checked={cfg.emboss} onChange={(e) => set({ emboss: e.target.checked })} className="accent-[var(--accent)]" />Embossed print</label>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Finishes are shown as visual hints. We confirm what is possible for your size and material.</p>
          </fieldset>
    ),
    [cfg.surface, cfg.foil, cfg.emboss], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const qtyBlock = useMemo(
    () => (
        <div>
            <label htmlFor="qty" className={`${legend} block`}>7. Quantity</label>
            <select id="qty" className={field} value={cfg.qty} onChange={(e) => set({ qty: Number(e.target.value) })}>
              {QUANTITIES.map((q) => <option key={q} value={q}>{q === 10000 ? "10,000 or more" : q.toLocaleString("en-US")}</option>)}
            </select>
          </div>
    ),
    [cfg.qty], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const sizeBlock = (
        <fieldset>
            <legend className={legend}>2. Size</legend>
            <div role="radiogroup" aria-label="Unit" className="mb-3 flex gap-2">
              {(["cm", "in"] as Unit[]).map((u) => (
                <label key={u} className={choice}><input type="radio" name="unit" checked={cfg.unit === u} onChange={() => set({ unit: u })} className="accent-[var(--accent)]" />{u === "cm" ? "Centimetres" : "Inches"}</label>
              ))}
            </div>
            <div className="grid gap-3">
              <Dim id="dim-l" label={t.names[0]} cm={cfg.l} range={t.limits.l} unit={cfg.unit} onChange={(v) => setDim("l", v)} />
              <Dim id="dim-w" label={t.names[1]} cm={cfg.w} range={t.limits.w} unit={cfg.unit} onChange={(v) => setDim("w", v)} />
              <Dim id="dim-h" label={t.names[2]} cm={cfg.h} range={t.limits.h} unit={cfg.unit} onChange={(v) => setDim("h", v)} />
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Outside size. Limits for this product: {t.names[0].toLowerCase()} {fmt(t.limits.l[0], cfg.unit)} to {fmt(t.limits.l[1], cfg.unit)}, {t.names[1].toLowerCase()} {fmt(t.limits.w[0], cfg.unit)} to {fmt(t.limits.w[1], cfg.unit)}, height {fmt(t.limits.h[0], cfg.unit)} to {fmt(t.limits.h[1], cfg.unit)} {cfg.unit}.</p>
          </fieldset>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <form className="grid gap-6" onSubmit={(e) => e.preventDefault()} aria-label="Box options">
        {productBlock}
        {sizeBlock}
        {materialBlock}
        {colourBlock}
        {printBlock}
        {finishBlock}
        {qtyBlock}
      </form>

      <div className="grid gap-6 lg:sticky lg:top-24">
        <section aria-label="Preview">
          <div className="relative overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)]">
            <div className="relative aspect-[5/4] w-full max-h-[30rem]">
              <div className="absolute inset-0 grid place-items-center p-6 transition-opacity duration-500" style={{ opacity: ready ? 0 : 1 }} aria-hidden>
                {!ready && <ProductPoster page={posterPage} className="h-full max-h-72 w-full" />}
              </div>
              <div
                ref={hostRef} role="img" tabIndex={gl ? 0 : -1} aria-label={`3D preview. ${describe(settled)} Drag or use the arrow keys to turn it. Double tap or press Home to reset.`}
                onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
                className="absolute inset-0 touch-none outline-offset-[-3px] transition-opacity duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]" style={{ opacity: ready ? 1 : 0, cursor: ready ? "grab" : "default" }}
              />
              {["L", "W", "H"].map((n, i) => (
                <span
                  key={n} ref={(el) => { labelRefs.current[i] = el; }} aria-hidden
                  className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-[4px] bg-[var(--fg)] px-1.5 py-0.5 text-xs font-semibold text-[var(--bg)] opacity-0 transition-opacity duration-200 ${LABEL_SHIFT[i]}`}
                >
                  {n} {fmt([cfg.l, cfg.w, cfg.h][i], cfg.unit)} {cfg.unit}
                </span>
              ))}
            </div>
            <div className="border-t border-[var(--line)] px-4 py-3">
              {gl === false ? (
                <p className="text-sm text-[var(--muted)]">The 3D preview is not available on this device. The dieline and the summary below still work.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label htmlFor="fold" className="text-sm font-semibold">Flat sheet</label>
                  <input id="fold" type="range" min={0} max={1} step={0.005} value={fold} onChange={(e) => onFold(Number(e.target.value))} aria-valuetext={fold > 0.95 ? "Folded" : fold < 0.05 ? "Flat" : `${Math.round(fold * 100)} percent folded`} className="min-w-[8rem] flex-1 accent-[var(--accent)]" />
                  <span className="text-sm font-semibold">Folded</span>
                  <button type="button" onClick={() => previewRef.current?.pv.resetView()} className="rounded-[var(--r-btn)] border border-[var(--line-strong)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--fg)]">Reset view</button>
                </div>
              )}
              <p className="mt-2 text-xs text-[var(--muted)]">Drag to turn the box. Double tap to reset. A preview, not a final render.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="sum-h" className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 id="sum-h" className="font-display text-xl font-medium">Your summary</h2>
          <table className="mt-3 w-full text-left text-[0.95rem]" aria-live="polite">
            <tbody>
              {lines.map(([k, v]) => (
                <tr key={k} className="border-t border-[var(--line)]">
                  <th scope="row" className="w-2/5 py-2 pr-3 align-top font-semibold">{k}</th>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
              {logo && <tr className="border-t border-[var(--line)]"><th scope="row" className="py-2 pr-3 align-top font-semibold">Logo</th><td className="py-2">{logo.name} (preview only)</td></tr>}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-[var(--muted)]">{ARTWORK_NOTE}</p>
          <Link href={`/quote/?${configToParams(cfg).toString()}`} className="mt-4 inline-flex w-full items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-6 py-3.5 text-base font-semibold text-[var(--on-accent)] hover:bg-[var(--fg)] sm:w-auto">Send to quote</Link>
        </section>
      </div>

      <section aria-labelledby="die-h" className="lg:col-span-2">
        <h2 id="die-h" className="font-display mb-3 text-2xl font-medium">Dieline, {fmt(settled.l, settled.unit)} x {fmt(settled.w, settled.unit)} x {fmt(settled.h, settled.unit)} {settled.unit}</h2>
        <Dieline cfg={settled} />
      </section>
    </div>
  );
}
