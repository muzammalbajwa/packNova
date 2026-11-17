"use client";

import { site } from "@/content/site";
import StageArt from "@/components/ui/StageArt";
import StoryEngine, { CHAPTER_LIST, STAGE_IDS, useStoryLinks, type StoryApi } from "@/shared/StoryEngine";
import { copy } from "./copy";

const M = site.making;
const num = (i: number) => String(i + 1).padStart(2, "0");

function Cta({ links }: { links: StoryApi["links"] }) {
  return (
    <div className="fade-in pointer-events-auto">
      <h3 className="font-display text-3xl font-medium leading-[1.1] md:text-5xl">{M.cta.title}</h3>
      <p className="mt-3 hidden max-w-sm text-lg text-[var(--muted)] md:block">{M.cta.body}</p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <a href={links.configuratorHref} onClick={links.onConfigurator} className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-6 py-3 text-base font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]">
          {M.cta.primary}
        </a>
        <a href={links.whatsappHref} target="_blank" rel="noopener noreferrer" onClick={links.onWhatsapp} className="inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--line-strong)] px-6 py-3 text-base font-semibold text-[var(--fg)] transition-colors hover:border-[var(--fg)]">
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

/** Dark frame; the 3D box in a thin-bordered panel; caption on the left; a rule-based step list along the bottom. */
function Overlay(api: StoryApi) {
  const { stage, chapter, chapters, cta, stages, goTo, links, showQuote } = api;
  const last = stage === stages.length - 1;
  return (
    <>
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-[11.5rem] md:w-[38%] md:max-w-none md:justify-center md:pb-24 md:pl-10 md:pr-0 lg:ml-[calc((100vw-80rem)/2)] xl:ml-0">
        <p className="mb-3 text-base font-semibold text-[var(--kraft-ink)]">{copy.story.label}</p>
        <div key={stage} className="fade-in" aria-live="polite">
          {last && cta ? (
            <Cta links={links} />
          ) : (
            <>
              <p className="font-display text-2xl text-[var(--kraft-ink)]">{num(stage)} <span className="text-[var(--muted)]">/ {stages.length}</span></p>
              <h2 className="font-display mt-2 text-balance text-4xl font-medium leading-[1.05] md:text-6xl">{stages[stage].title}</h2>
              <p className="mt-4 max-w-sm text-lg text-[var(--muted)] md:text-xl">{stages[stage].line}</p>
              {showQuote && (
                <a href={links.quoteHref} onClick={() => links.onQuote(STAGE_IDS[stage])} className="pointer-events-auto mt-4 inline-flex rounded-[var(--r-btn)] border border-[var(--line-strong)] px-4 py-2 text-base font-semibold text-[var(--fg)] transition-colors hover:border-[var(--fg)]">
                  {M.quoteButton} →
                </a>
              )}
            </>
          )}
        </div>
      </div>

      <nav aria-label={M.stepsLabel} className="absolute inset-x-0 bottom-[4.9rem] z-20 px-3 md:bottom-6">
        <div className="mx-auto mb-2 h-px max-w-3xl bg-[var(--line)]">
          <div className="h-0.5 origin-left bg-[var(--accent)] [transform:scaleX(var(--p))]" />
        </div>
        <ol className="mx-auto flex max-w-3xl items-center justify-between gap-1 overflow-x-auto">
          {/* the current chapter shows its steps; the other one collapses into a single button */}
          {chapters.map((ch, c) =>
            c === chapter ? (
              <li key={ch.id} className="flex items-center gap-1">
                <span className="mr-2 hidden text-sm font-semibold text-[var(--kraft-ink)] sm:inline">{ch.label}</span>
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
                          className={`rounded-[var(--r-btn)] px-3 py-2 text-base font-semibold transition-colors ${
                            i === stage ? "bg-[var(--accent)] text-[var(--on-accent)]" : i < stage ? "text-[var(--fg)] hover:bg-[var(--wash)]" : "text-[var(--muted)] hover:bg-[var(--wash)]"
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
                  className={`rounded-[var(--r-btn)] border border-[var(--line)] px-3 py-2 text-sm font-semibold transition-colors hover:border-[var(--line-strong)] ${c < chapter ? "text-[var(--fg)]" : "text-[var(--muted)]"}`}
                >
                  {ch.label} <span className="opacity-70">· {ch.count}</span>
                </button>
              </li>
            ),
          )}
        </ol>
      </nav>
    </>
  );
}

function Fallback({ base }: { base: string }) {
  const links = useStoryLinks(base);
  return (
    <section id="making" aria-labelledby="making-h" className="tone-dark relative z-10 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-base font-semibold text-[var(--kraft-ink)]">{copy.story.label}</p>
        <h2 id="making-h" className="font-display mt-3 max-w-3xl text-4xl font-medium leading-[1.1] md:text-5xl">{copy.story.fallbackHeading}</h2>
        {CHAPTER_LIST.map((ch) => (
          <div key={ch.id} className="mt-12">
            <h3 className="border-b border-[var(--line-strong)] pb-2 text-sm font-semibold text-[var(--kraft-ink)]">{ch.label}</h3>
            <ol>
              {M.stages.slice(ch.from, ch.to + 1).map((s, k) => {
                const i = ch.from + k;
                return (
                  <li key={s.step} className="grid grid-cols-[3.5rem_1fr] items-start gap-x-5 border-b border-[var(--line)] py-5 sm:grid-cols-[3.5rem_5rem_1fr]">
                    <span className="font-display pt-1 text-lg text-[var(--kraft-ink)]">{num(i)}</span>
                    <StageArt id={STAGE_IDS[i]} className="hidden size-16 text-[var(--accent)] sm:block" />
                    <div>
                      <h4 className="font-display text-2xl font-medium leading-tight">{s.title}</h4>
                      <p className="mt-1 max-w-xl text-[var(--muted)]">{s.line}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <div className="mt-12"><Cta links={links} /></div>
      </div>
    </section>
  );
}

export default function Story({ base }: { base: string }) {
  return (
    <StoryEngine
      base={base}
      stickyClassName="tone-dark"
      canvasClassName="absolute inset-x-3 top-16 h-[42%] overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] md:inset-x-auto md:bottom-24 md:right-6 md:top-20 md:h-auto md:w-[56%]"
      overlay={Overlay}
      fallback={<Fallback base={base} />}
    />
  );
}
