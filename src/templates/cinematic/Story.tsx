"use client";

import { site } from "@/content/site";
import StageArt from "@/components/ui/StageArt";
import StoryEngine, { CHAPTER_LIST, STAGE_IDS, useStoryLinks, type StoryApi } from "@/shared/StoryEngine";

const M = site.making;
const num = (i: number) => String(i + 1).padStart(2, "0");

function Cta({ links }: { links: StoryApi["links"] }) {
  return (
    <div className="pointer-events-auto text-center">
      <h3 className="font-display text-2xl font-extrabold leading-[1] tracking-[-0.035em] md:text-4xl">{M.cta.title}</h3>
      <p className="mx-auto mt-3 hidden max-w-md text-[var(--muted)] md:block">{M.cta.body}</p>
      <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
        <a href={links.configuratorHref} onClick={links.onConfigurator} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-7 py-2.5 font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]">
          {M.cta.primary}
        </a>
        <a href={links.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={links.onWhatsapp} className="inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--line-strong)] px-7 py-2.5 font-medium transition-colors hover:border-[var(--fg)]">
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

/** Full-bleed 3D. Captions fade in over the bottom; a hairline progress bar runs along the top edge. */
function Overlay(api: StoryApi) {
  const { stage, chapter, chapters, cta, stages, goTo, links, showQuote } = api;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[3px] bg-[var(--line)]">
        <div className="h-full origin-left bg-[var(--accent)] [transform:scaleX(var(--p))]" />
      </div>

      <p className="eyebrow absolute left-8 top-8 z-10 hidden md:block">{M.eyebrow}</p>
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-end px-4 pb-[8.25rem] md:pb-10">
        {/* every caption sits in the same grid cell, so the card is as tall as the tallest one (the CTA) */}
        <div className="glass grid w-full max-w-2xl rounded-[var(--r-card)]" aria-live="polite">
          {stages.map((c, i) => {
            const active = i === stage;
            const last = i === stages.length - 1;
            return (
              <div
                key={c.step}
                aria-hidden={!active}
                className={`col-start-1 row-start-1 flex flex-col justify-center px-6 py-5 text-center md:px-10 ${
                  // swap at once (the outgoing caption is hidden, the incoming one is fully opaque and only slides in)
                  active ? "translate-y-0 opacity-100 transition-transform duration-300 ease-out" : "pointer-events-none invisible translate-y-3 opacity-0"
                }`}
              >
                {last && cta ? (
                  <Cta links={links} />
                ) : (
                  <>
                    <span className="mx-auto mb-2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--on-accent)]">
                      {num(i)} / {num(stages.length - 1)}
                    </span>
                    <h2 className="font-display text-2xl font-extrabold leading-[1.02] tracking-[-0.03em] md:text-4xl">{c.title}</h2>
                    <p className="mx-auto mt-2 max-w-md text-[var(--muted)]">{c.line}</p>
                    {showQuote && i === stage && (
                      <a href={links.quoteHref} onClick={() => links.onQuote(STAGE_IDS[stage])} className="pointer-events-auto mx-auto mt-3 text-sm font-medium text-[var(--accent)] underline underline-offset-4">
                        {M.quoteButton} →
                      </a>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* step dots in two chapters: vertical on the right edge (desktop), a row above the bottom bar (phones) */}
      <nav aria-label={M.stepsLabel} className="absolute inset-x-0 bottom-[4.9rem] z-20 flex justify-center md:inset-x-auto md:bottom-auto md:right-6 md:top-1/2 md:-translate-y-1/2">
        <ol className="glass flex items-center gap-0.5 rounded-full px-2 py-1.5 md:flex-col md:gap-1 md:py-2">
          <li className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)] md:hidden">{chapters[chapter].label}</li>
          {chapters.map((ch, c) => (
            <li key={ch.id} className="flex items-center gap-0.5 md:flex-col md:gap-1">
              {c > 0 && <span aria-hidden className="mx-1 h-3 w-px bg-[var(--line-strong)] md:mx-0 md:my-1 md:h-px md:w-5" />}
              <button type="button" onClick={() => api.goToChapter(c)} className={`hidden text-[10px] font-semibold uppercase tracking-[0.18em] md:block ${c === chapter ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`}>
                {ch.label}
              </button>
              <ol className="flex items-center gap-0.5 md:flex-col md:gap-0">
                {stages.slice(ch.from, ch.to + 1).map((s, k) => {
                  const i = ch.from + k;
                  return (
                    <li key={s.step}>
                      <button type="button" aria-current={i === stage ? "step" : undefined} aria-label={`${i + 1}. ${s.step}`} onClick={() => goTo(i)} className="group relative grid size-5 place-items-center md:size-6">
                        <span className={`block rounded-full transition-all duration-500 ${i === stage ? "size-3 bg-[var(--accent)]" : i < stage ? "size-2 bg-[var(--fg)]" : "size-2 bg-[var(--line-strong)] group-hover:bg-[var(--fg)]"}`} />
                        <span className="glass pointer-events-none absolute right-9 hidden whitespace-nowrap rounded-full px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100 md:block">{s.step}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

function Fallback() {
  const links = useStoryLinks("/t/cinematic");
  return (
    <section id="making" aria-labelledby="making-h" className="relative z-10 bg-[var(--bg)] px-6 py-24 md:py-36">
      <div className="mx-auto max-w-6xl text-center">
        <p className="eyebrow">{M.eyebrow}</p>
        <h2 id="making-h" className="font-display mx-auto mt-5 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.035em] md:text-7xl">From flat board to your door.</h2>
        {CHAPTER_LIST.map((ch) => (
          <div key={ch.id} className="mt-14 text-left">
            <p className="eyebrow">{ch.label}</p>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {M.stages.slice(ch.from, ch.to + 1).map((s, k) => {
                const i = ch.from + k;
                return (
                  <li key={s.step} className="glass rounded-[var(--r-card)] p-6">
                    <StageArt id={STAGE_IDS[i]} className="size-20" />
                    <p className="mt-4 text-sm tabular-nums text-[var(--accent)]">{num(i)} / {num(M.stages.length - 1)}</p>
                    <h4 className="font-display mt-1 text-2xl font-bold tracking-tight">{s.title}</h4>
                    <p className="mt-2 text-[var(--muted)]">{s.line}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <div className="glass mx-auto mt-10 max-w-2xl rounded-[var(--r-card)] p-8"><Cta links={links} /></div>
      </div>
    </section>
  );
}

export default function Story({ base }: { base: string }) {
  return <StoryEngine base={base} canvasClassName="absolute inset-0" overlay={Overlay} fallback={<Fallback />} />;
}
