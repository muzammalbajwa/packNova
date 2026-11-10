"use client";

import { site } from "@/content/site";
import StageArt from "@/components/ui/StageArt";
import { BOX_CM } from "@/lib/making";
import { THEMES } from "@/lib/palette";
import StoryEngine, { STAGE_IDS, useStoryLinks, type StoryApi } from "@/shared/StoryEngine";

const M = site.making;
const INK = THEMES.d.ink;
const num = (i: number) => String(i + 1).padStart(2, "0");
const total = num(M.stages.length - 1);
const SPEC_ROWS = (current: string): [string, string][] => [
  ["BOARD", site.configurator.materials.map((m) => m.label).join(" / ")],
  ["FINISH", M.stages[2].title],
  ["PROCESS", current],
  ["CARTON", `${BOX_CM.l} × ${BOX_CM.w} × ${BOX_CM.h} cm`],
];

function Cta({ links }: { links: StoryApi["links"] }) {
  return (
    <div className="pointer-events-auto">
      <h3 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] lg:text-4xl">{M.cta.title}</h3>
      <p className="mt-3 hidden text-[var(--muted)] lg:block">{M.cta.body}</p>
      <div className="mt-4 flex flex-col gap-0">
        <a href={links.configuratorHref} onClick={links.onConfigurator} className="mono bg-[var(--accent)] px-5 py-3 text-center text-sm font-medium uppercase text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]">
          {M.cta.primary} →
        </a>
        <a href={links.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={links.onWhatsapp} className="mono border border-[var(--fg)] border-t-0 px-5 py-3 text-center text-sm font-medium uppercase transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]">
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

function SpecTable({ current }: { current: string }) {
  return (
    <table className="mono mt-4 w-full border-collapse text-[11px] uppercase">
      <tbody>
        {SPEC_ROWS(current).map(([k, v]) => (
          <tr key={k} className="border-t border-[var(--fg)]">
            <td className="w-24 py-1.5 pr-3 text-[var(--muted)]">{k}</td>
            <td className="py-1.5">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Blueprint sheet: contents table left, the framed 3D panel in the middle, step data right. */
function Overlay(api: StoryApi) {
  const { stage, cta, stages, goTo, links, showQuote } = api;
  const last = stage === stages.length - 1;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[var(--fg)]">
      {/* frame + annotations over the canvas panel */}
      <div className="ticks absolute inset-x-3 top-16 h-[42%] lg:inset-y-6 lg:left-[17.5rem] lg:right-[23.5rem] lg:h-auto">
        <span className="mono absolute left-3 top-2 text-[11px] uppercase text-[var(--muted)]">FIG. {num(stage)}</span>
        <span className="mono absolute right-3 top-2 text-[11px] uppercase text-[var(--muted)]">{stages[stage].step}</span>
        <span className="mono absolute bottom-2 left-3 flex gap-4 text-[11px] uppercase text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-5" style={{ background: INK.cut }} /> Cut</span>
          <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-5" style={{ background: `repeating-linear-gradient(90deg,${INK.crease} 0 4px,transparent 4px 7px)` }} /> Crease</span>
        </span>
        <span className="absolute inset-x-10 bottom-8 hidden h-px bg-[var(--fg)] lg:block" />
        <span className="mono absolute bottom-[2.4rem] left-1/2 hidden -translate-x-1/2 bg-[var(--bg)] px-2 text-[11px] lg:block">W</span>
        <span className="absolute inset-y-14 left-4 hidden w-px bg-[var(--fg)] lg:block" />
        <span className="mono absolute left-[0.4rem] top-1/2 hidden -translate-y-1/2 bg-[var(--bg)] py-1 text-[11px] lg:block">H</span>
      </div>

      {/* desktop: contents table */}
      <aside className="pointer-events-auto absolute bottom-6 left-6 top-6 hidden w-64 flex-col border border-[var(--fg)] bg-[var(--bg)] lg:flex">
        <p className="mono border-b border-[var(--fg)] bg-[var(--fg)] px-4 py-2 text-xs uppercase text-[var(--bg)]">{M.stepsLabel}</p>
        <nav aria-label={M.stepsLabel} className="flex-1">
          <ol>
            {stages.map((c, i) => (
              <li key={c.step} className="border-b border-[var(--line-strong)]">
                <button type="button" aria-current={i === stage ? "step" : undefined} onClick={() => goTo(i)} className={`mono flex w-full items-center gap-3 px-4 py-3 text-left text-xs uppercase transition-colors duration-150 ${i === stage ? "bg-[var(--accent)] text-[var(--on-accent)]" : i < stage ? "text-[var(--fg)] hover:bg-[var(--wash)]" : "text-[var(--muted)] hover:bg-[var(--wash)]"}`}>
                  <span className="tabular-nums">{num(i)}</span>
                  <span className="flex-1">{c.step}</span>
                  <span aria-hidden>{i < stage ? "■" : i === stage ? "▶" : "□"}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="h-2 border-t border-[var(--fg)]"><div className="h-full origin-left bg-[var(--accent)] [transform:scaleX(var(--p))]" /></div>
      </aside>

      {/* step data: right column on desktop, a panel under the canvas on phones */}
      <aside className="pointer-events-auto absolute inset-x-3 bottom-[8.6rem] top-[calc(4rem+42%+0.5rem)] overflow-hidden border border-[var(--fg)] bg-[var(--bg)] p-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-6 lg:w-[22rem] lg:p-5" aria-live="polite">
        <p className="mono flex items-center justify-between text-xs uppercase text-[var(--accent)] xl:pr-36">
          <span>STEP {num(stage)} / {total}</span>
          <span className="text-[var(--muted)]">{M.eyebrow}</span>
        </p>
        <div key={stage} className="ind-wipe mt-3">
          {last && cta ? (
            <Cta links={links} />
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-[-0.03em] lg:text-4xl">{stages[stage].title}</h2>
              <p className="mt-2 text-[var(--muted)] lg:mt-3 lg:text-lg">{stages[stage].line}</p>
              <div className="hidden lg:block"><SpecTable current={stages[stage].step} /></div>
              {showQuote && (
                <a href={links.quoteHref} onClick={() => links.onQuote(STAGE_IDS[stage])} className="mono pointer-events-auto mt-3 inline-block border border-[var(--fg)] px-3 py-2 text-[11px] uppercase hover:bg-[var(--fg)] hover:text-[var(--bg)] lg:mt-5">
                  {M.quoteButton} →
                </a>
              )}
            </>
          )}
        </div>
      </aside>

      {/* phones: numbered contents row */}
      <nav aria-label={M.stepsLabel} className="pointer-events-auto absolute inset-x-3 bottom-[4.9rem] lg:hidden">
        <div className="mb-1 h-1 bg-[var(--line)]"><div className="h-full origin-left bg-[var(--accent)] [transform:scaleX(var(--p))]" /></div>
        <ol className="grid grid-cols-7 border border-[var(--fg)] bg-[var(--bg)]">
          {stages.map((c, i) => (
            <li key={c.step} className="border-r border-[var(--line-strong)] last:border-r-0">
              <button type="button" aria-current={i === stage ? "step" : undefined} aria-label={`${i + 1}. ${c.step}`} onClick={() => goTo(i)} className={`mono h-9 w-full text-xs ${i === stage ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)]"}`}>
                {num(i)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function Fallback() {
  const links = useStoryLinks("/t/industrial");
  return (
    <section id="making" aria-labelledby="making-h" className="relative z-10 grid-paper px-5 py-24 md:px-10 md:py-32">
      <p className="eyebrow uppercase">§ 03 — {M.eyebrow}</p>
      <h2 id="making-h" className="font-display mt-4 max-w-4xl text-5xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-7xl">From flat board to finished box.</h2>
      <ol className="mt-12 border-t border-[var(--fg)] bg-[var(--surface)]">
        {M.stages.map((s, i) => (
          <li key={s.step} className="grid items-center gap-4 border-b border-[var(--fg)] p-4 md:grid-cols-[6rem_6rem_1fr_1.4fr] md:p-5">
            <span className="mono text-sm text-[var(--accent)]">STEP {num(i)} / {total}</span>
            <StageArt id={STAGE_IDS[i]} className="size-16" />
            <span className="font-display text-xl font-bold uppercase tracking-tight">{s.title}</span>
            <span className="text-[var(--muted)]">{s.line}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 max-w-xl border border-[var(--fg)] bg-[var(--surface)] p-6"><Cta links={links} /></div>
    </section>
  );
}

export default function Story({ base }: { base: string }) {
  return (
    <StoryEngine
      base={base}
      canvasClassName="absolute inset-x-3 top-16 h-[42%] border border-[var(--fg)] bg-[var(--surface)] lg:inset-y-6 lg:left-[17.5rem] lg:right-[23.5rem] lg:h-auto"
      overlay={Overlay}
      fallback={<Fallback />}
    />
  );
}
