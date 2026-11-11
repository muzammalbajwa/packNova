"use client";

import { site } from "@/content/site";
import StageArt from "@/components/ui/StageArt";
import StoryEngine, { CHAPTER_LIST, STAGE_IDS, useStoryLinks, type StoryApi } from "@/shared/StoryEngine";

const M = site.making;
const num = (i: number) => String(i + 1).padStart(2, "0");

function Cta({ links }: { links: StoryApi["links"] }) {
  return (
    <div className="pop pointer-events-auto">
      <h3 className="font-display text-3xl font-extrabold leading-[1] tracking-[-0.02em] md:text-5xl">{M.cta.title}</h3>
      <p className="mt-3 hidden max-w-sm text-lg text-[var(--muted)] md:block">{M.cta.body}</p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <a href={links.configuratorHref} onClick={links.onConfigurator} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-7 py-3.5 text-base font-bold text-[var(--on-accent)] transition-transform duration-300 [transition-timing-function:var(--spring)] hover:scale-105">
          {M.cta.primary}
        </a>
        <a href={links.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={links.onWhatsapp} className="inline-flex items-center justify-center rounded-[var(--r-btn)] border-2 border-[var(--accent)] px-7 py-3.5 text-base font-bold text-[var(--accent)] transition-transform duration-300 [transition-timing-function:var(--spring)] hover:scale-105">
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

/** Rounded card with the 3D box; caption bubble on the left; tappable stage chips along the bottom. */
function Overlay(api: StoryApi) {
  const { stage, chapter, chapters, cta, stages, goTo, links, showQuote } = api;
  const last = stage === stages.length - 1;
  return (
    <>
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-[11.5rem] md:w-[38%] md:max-w-none md:justify-center md:pb-24 md:pl-10 md:pr-0 lg:ml-[calc((100vw-80rem)/2)] xl:ml-0">
        <p className="mb-3 w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]">{M.eyebrow}</p>
        <div key={stage} className="pop" aria-live="polite">
          {last && cta ? (
            <Cta links={links} />
          ) : (
            <>
              <span className="sticker inline-grid size-14 place-items-center rounded-full bg-[var(--surface)] font-display text-xl font-extrabold text-[var(--accent)] md:size-16 md:text-2xl">{num(stage)}</span>
              <h2 className="font-display mt-3 text-4xl font-extrabold leading-[0.98] tracking-[-0.02em] md:text-6xl">{stages[stage].title}</h2>
              <p className="mt-3 max-w-sm text-lg leading-relaxed text-[var(--muted)]">{stages[stage].line}</p>
              {showQuote && (
                <a href={links.quoteHref} onClick={() => links.onQuote(STAGE_IDS[stage])} className="pointer-events-auto mt-4 inline-flex rounded-full border-2 border-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent)] transition-transform duration-300 [transition-timing-function:var(--spring)] hover:scale-105">
                  {M.quoteButton} →
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <nav aria-label={M.stepsLabel} className="absolute inset-x-0 bottom-[4.9rem] z-20 px-3 md:bottom-6">
        <div className="mb-2 mx-auto h-1.5 max-w-3xl overflow-hidden rounded-full bg-[var(--wash)]">
          <div className="h-full origin-left rounded-full bg-[var(--accent)] [transform:scaleX(var(--p))]" />
        </div>
        <ol className="mx-auto flex max-w-3xl items-center justify-between gap-1 overflow-x-auto">
          {/* the current chapter shows its step pills; the other one collapses into a single chip */}
          {chapters.map((ch, c) =>
            c === chapter ? (
              <li key={ch.id} className="flex items-center gap-1">
                <span className="mr-1 hidden rounded-full border-2 border-[var(--accent)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[var(--accent)] sm:inline">{ch.label}</span>
                <ol className="flex gap-1">
                  {stages.slice(ch.from, ch.to + 1).map((s, k) => {
                    const i = ch.from + k;
                    return (
                      <li key={s.step}>
                        <button
                          type="button"
                          aria-current={i === stage ? "step" : undefined}
                          aria-label={`${i + 1}. ${s.step}`}
                          onClick={() => goTo(i)}
                          className={`rounded-full px-3 py-2 text-sm font-bold transition-transform duration-300 [transition-timing-function:var(--spring)] ${
                            i === stage ? "scale-110 bg-[var(--accent)] text-[var(--on-accent)]" : i < stage ? "bg-[var(--surface)] text-[var(--fg)] hover:scale-105" : "bg-[var(--wash)] text-[var(--muted)] hover:scale-105"
                          }`}
                        >
                          <span className="md:hidden">{i + 1}</span>
                          <span className="hidden md:inline">{s.step}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ) : (
              <li key={ch.id}>
                <button
                  type="button"
                  aria-label={`${ch.label}: ${ch.count} steps`}
                  onClick={() => api.goToChapter(c)}
                  className={`rounded-full px-3 py-2 text-sm font-bold transition-transform duration-300 [transition-timing-function:var(--spring)] hover:scale-105 ${c < chapter ? "bg-[var(--surface)] text-[var(--fg)]" : "bg-[var(--wash)] text-[var(--muted)]"}`}
                >
                  {ch.label} <span className="opacity-60">· {ch.count}</span>
                </button>
              </li>
            ),
          )}
        </ol>
      </nav>
    </>
  );
}

function Fallback() {
  const links = useStoryLinks("/t/eco");
  return (
    <section id="making" aria-labelledby="making-h" className="relative z-10 bg-[var(--bg)] px-5 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]">{M.eyebrow}</p>
        <h2 id="making-h" className="font-display mt-5 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-7xl">From flat board to your door.</h2>
        {CHAPTER_LIST.map((ch) => (
          <div key={ch.id} className="mt-12">
            <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--accent)]">{ch.label}</h3>
            <ol className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {M.stages.slice(ch.from, ch.to + 1).map((s, k) => {
                const i = ch.from + k;
                return (
                  <li key={s.step} className="rounded-[var(--r-card)] bg-[var(--surface)] p-6">
                    <StageArt id={STAGE_IDS[i]} className="size-20" />
                    <span className="mt-4 inline-grid size-10 place-items-center rounded-full bg-[var(--accent)] font-display text-lg font-extrabold text-[var(--on-accent)]">{num(i)}</span>
                    <h4 className="font-display mt-3 text-2xl font-bold tracking-tight">{s.title}</h4>
                    <p className="mt-2 text-[var(--muted)]">{s.line}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <div className="mt-10 rounded-[2.5rem] bg-[var(--surface)] p-8"><Cta links={links} /></div>
      </div>
    </section>
  );
}

export default function Story({ base }: { base: string }) {
  return (
    <StoryEngine
      base={base}
      canvasClassName="absolute inset-x-3 top-16 h-[42%] overflow-hidden rounded-[2.5rem] bg-[var(--surface)] md:inset-x-auto md:bottom-24 md:right-6 md:top-20 md:h-auto md:w-[56%]"
      behind={<span className="morph pointer-events-none absolute right-[-8vw] top-[4%] size-[44vw] bg-[var(--accent)] opacity-10" aria-hidden />}
      overlay={Overlay}
      fallback={<Fallback />}
    />
  );
}
