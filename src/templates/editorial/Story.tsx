"use client";

import { site } from "@/content/site";
import StageArt from "@/components/ui/StageArt";
import StoryEngine, { useStoryLinks, type StoryApi } from "@/shared/StoryEngine";
import { STAGE_IDS } from "@/shared/StoryEngine";

const M = site.making;
const num = (i: number) => String(i + 1).padStart(2, "0");

function Cta({ links }: { links: StoryApi["links"] }) {
  return (
    <div className="pointer-events-auto">
      <h3 className="font-display text-4xl font-light leading-[1] tracking-[-0.02em] md:text-6xl">{M.cta.title}</h3>
      <p className="mt-4 hidden max-w-sm text-lg text-[var(--muted)] md:block">{M.cta.body}</p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row md:mt-7">
        <a
          href={links.configuratorHref}
          onClick={links.onConfigurator}
          className="inline-flex items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] px-7 py-3 text-base font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]"
        >
          {M.cta.primary}
        </a>
        <a
          href={links.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={links.onWhatsapp}
          className="inline-flex items-center justify-center rounded-[var(--r-btn)] border border-[var(--fg)] px-7 py-3 text-base font-medium transition-colors hover:bg-[var(--wash)]"
        >
          {M.cta.secondary}
        </a>
      </div>
    </div>
  );
}

/** Text left (big numeral, serif title), 3D on the right half, a thin vertical step rule. */
function Overlay(api: StoryApi) {
  const { stage, cta, stages, goTo, links, showQuote } = api;
  return (
    <>
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-[7.75rem] md:justify-center md:pb-0">
        <p className="eyebrow mb-4 border-t border-[var(--fg)] pt-3 md:max-w-[44%]">{M.eyebrow}</p>
        <div className="relative min-h-[15rem] md:min-h-[24rem] md:max-w-[44%]" aria-live="polite">
          {stages.map((c, i) => {
            const active = i === stage;
            return (
              <div
                key={c.step}
                aria-hidden={!active}
                className={`absolute inset-x-0 top-0 ${
                  // swap at once (the outgoing caption is hidden, the incoming one is fully opaque and only slides in)
                  active ? "translate-y-0 opacity-100 transition-transform duration-300 ease-out" : "pointer-events-none invisible translate-y-4 opacity-0"
                }`}
              >
                {i === stages.length - 1 && cta ? (
                  <Cta links={links} />
                ) : (
                  <>
                    <span className="font-display text-[5rem] font-extralight italic leading-none text-[var(--kraft-ink)] md:text-[9rem]">{num(i)}</span>
                    <h2 className="font-display mt-2 text-4xl font-light leading-[1] tracking-[-0.02em] md:text-6xl">{c.title}</h2>
                    <p className="mt-4 max-w-sm text-lg leading-relaxed text-[var(--muted)]">{c.line}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {showQuote && (
          <a
            href={links.quoteHref}
            onClick={() => links.onQuote(STAGE_IDS[stage])}
            className="pointer-events-auto mt-2 w-fit border-b border-[var(--fg)] pb-0.5 text-sm font-medium"
          >
            {M.quoteButton} →
          </a>
        )}
      </div>

      {/* thin step rule: vertical at the left edge on desktop, along the bottom on phones */}
      <nav aria-label={M.stepsLabel} className="absolute inset-x-4 bottom-[4.75rem] z-20 md:inset-x-auto md:bottom-auto md:left-5 md:top-1/2 md:-translate-y-1/2">
        <div className="relative">
          <div className="absolute left-2 right-2 top-3 h-px bg-[var(--line-strong)] md:inset-x-auto md:bottom-2 md:left-[0.55rem] md:right-auto md:top-2 md:h-auto md:w-px">
            <div className="h-full w-full origin-left bg-[var(--fg)] [transform:scaleX(var(--p))] md:origin-top md:[transform:scaleY(var(--p))]" />
          </div>
          <ol className="relative flex justify-between md:flex-col md:gap-6">
            {stages.map((c, i) => (
              <li key={c.step}>
                <button
                  type="button"
                  aria-current={i === stage ? "step" : undefined}
                  aria-label={`${i + 1}. ${c.step}`}
                  onClick={() => goTo(i)}
                  className="group flex items-center gap-3"
                >
                  <span
                    className={`grid size-6 place-items-center bg-[var(--bg)] font-display text-xs italic transition-colors duration-500 ${
                      i === stage ? "text-[var(--fg)] underline underline-offset-4" : "text-[var(--muted)] group-hover:text-[var(--fg)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`hidden font-display text-sm italic md:inline ${i === stage ? "text-[var(--fg)]" : "opacity-0 group-hover:opacity-100"}`}>{c.step}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}

/** No WebGL / reduced motion: the same seven steps as a quiet numbered list. */
function Fallback() {
  const links = useStoryLinks("/t/editorial");
  return (
    <section id="making" aria-labelledby="making-h" className="relative z-10 bg-[var(--bg)] px-6 py-24 md:py-36">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow border-t border-[var(--fg)] pt-3">{M.eyebrow}</p>
        <h2 id="making-h" className="font-display mt-6 max-w-3xl text-5xl font-light leading-[0.98] tracking-[-0.025em] md:text-7xl">
          From flat board to finished box.
        </h2>
        <ol className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {M.stages.map((s, i) => (
            <li key={s.step} className="border-t border-[var(--line-strong)] py-8 pr-6">
              <StageArt id={STAGE_IDS[i]} className="size-20" />
              <p className="font-display mt-4 text-5xl font-extralight italic text-[var(--kraft-ink)]">{num(i)}</p>
              <h3 className="font-display mt-2 text-2xl font-normal">{s.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{s.line}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <Cta links={links} />
        </div>
      </div>
    </section>
  );
}

export default function Story({ base }: { base: string }) {
  return (
    <StoryEngine
      base={base}
      canvasClassName="absolute right-0 top-0 h-full w-1/2 max-md:h-[50%] max-md:w-full"
      overlay={Overlay}
      fallback={<Fallback />}
    />
  );
}
