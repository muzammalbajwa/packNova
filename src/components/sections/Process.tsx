import { site } from "@/content/site";

export default function Process() {
  const { process } = site;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow" data-reveal>
          {process.eyebrow}
        </p>
        <h2
          data-reveal
          className="font-display mt-4 max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.025em] md:text-7xl"
        >
          {process.heading}
        </h2>

        <ol className="mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          {process.steps.map((s, i) => (
            <li key={s.title} data-reveal className="relative border-t border-[var(--line)] pt-6">
              <span className="font-display text-6xl font-bold tabular-nums text-[var(--kraft)]/30 md:text-7xl">
                0{i + 1}
              </span>
              <h3 className="font-display mt-4 text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 text-[var(--muted)]">{s.body}</p>
              <span className="absolute -top-px left-0 h-px w-12 bg-[var(--accent)]" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
