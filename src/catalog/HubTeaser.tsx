import Link from "next/link";
import "./pageEnd.css";
import { HUB, ROUTES } from "@/content/catalog";

/** Three mini line drawings: the flat sheet with its cut lines, the same sheet folding up, the finished box. */
function Mini({ step }: { step: 0 | 1 | 2 }) {
  return (
    <svg viewBox="0 0 120 80" className="ic h-24 w-36" aria-hidden="true" focusable="false">
      {step === 0 && (
        <>
          <polygon className="ic-s ic-t" points="14,52 60,72 106,52 60,32" />
          <path className="ic-s" strokeDasharray="3 3" d="M36 52 L60 62 L84 52 M60 62 V42" />
          <path className="ic-s ic-tape" d="M30 40 L50 49" />
        </>
      )}
      {step === 1 && (
        <>
          <polygon className="ic-s ic-t" points="14,56 60,76 60,52 26,38" />
          <polygon className="ic-s ic-l" points="60,76 106,56 106,34 60,52" />
          <polygon className="ic-s ic-r" points="60,52 106,34 82,22 36,30" />
        </>
      )}
      {step === 2 && (
        <>
          <polygon className="ic-s ic-l" points="24,36 60,52 60,76 24,60" />
          <polygon className="ic-s ic-r" points="96,36 60,52 60,76 96,60" />
          <polygon className="ic-s ic-t" points="60,22 96,36 60,52 24,36" />
          <polygon className="ic-s ic-ac" points="24,46 60,62 60,68 24,52" />
        </>
      )}
    </svg>
  );
}

/** The strip between the card grid and the closing band: the three steps every product goes through, a line that draws as it scrolls in, and a link to the configurator. */
export default function HubTeaser() {
  const t = HUB.teaser;
  return (
    <section aria-labelledby="hub-made-h" className="hub-teaser border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--sand)_45%,var(--bg))] px-6 py-16 md:py-24" style={{ "--ic-base": "#d8b98a", "--ic-accent": "var(--accent)" } as React.CSSProperties}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h2 id="hub-made-h" className="font-display text-balance text-3xl font-medium leading-[1.1] md:text-4xl">{t.title}</h2>
            <p className="mt-2 max-w-xl text-lg text-[var(--muted)]">{t.lead}</p>
          </div>
          <Link href={ROUTES.configurator} className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">{t.cta} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="relative mt-10">
          <svg aria-hidden="true" focusable="false" className="hub-line absolute left-0 top-12 hidden h-3 w-full md:block" viewBox="0 0 1000 12" preserveAspectRatio="none">
            <path d="M0 6 H1000" pathLength={1} fill="none" stroke="var(--kraft)" strokeWidth="2" strokeDasharray="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {t.steps.map((s, i) => (
              <li key={s.title} className="flex gap-5 md:flex-col md:gap-4">
                <span className="grid shrink-0 place-items-center bg-[color-mix(in_srgb,var(--sand)_45%,var(--bg))] md:w-fit md:pr-4"><Mini step={i as 0 | 1 | 2} /></span>
                <span>
                  <span className="font-display text-2xl font-medium">{s.title}</span>
                  <span className="mt-1 block max-w-xs text-[var(--muted)]">{s.line}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
