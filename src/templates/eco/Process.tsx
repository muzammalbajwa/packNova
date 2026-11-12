import { copy } from "./copy";

/** A plain numbered list: a heading column on the left, rows with top rules on the right. */
export default function Process() {
  const c = copy.process;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-6 pb-20 md:pb-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
        <div data-reveal="subtle">
          <h2 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{c.heading}</h2>
          <p className="mt-4 max-w-sm text-lg text-[var(--muted)]">{c.lead}</p>
        </div>
        <ol className="border-t border-[var(--line-strong)]">
          {c.steps.map((s, i) => (
            <li key={s.title} data-reveal="subtle" className="grid gap-x-8 gap-y-1 border-b border-[var(--line)] py-6 sm:grid-cols-[3rem_1fr]">
              <span className="font-display text-xl text-[var(--kraft-ink)]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="font-display text-2xl font-medium leading-tight">{s.title}</h3>
                <p className="mt-2 max-w-lg text-[var(--muted)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
