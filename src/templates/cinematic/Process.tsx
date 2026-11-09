import { site } from "@/content/site";

export default function Process() {
  const { process } = site;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-6 pb-28 md:pb-40">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-center">{process.eyebrow}</p>
        <h2 data-reveal className="font-display mx-auto mt-5 max-w-3xl text-center text-5xl font-bold leading-[0.95] tracking-[-0.035em] md:text-7xl">
          {process.heading}
        </h2>
        <ol className="relative mt-16 grid gap-4 md:grid-cols-4">
          <span className="pointer-events-none absolute left-[12%] right-[12%] top-[2.1rem] hidden h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)] md:block" aria-hidden />
          {process.steps.map((s, i) => (
            <li key={s.title} data-reveal className="glass relative rounded-[var(--r-card)] p-6">
              <span className="relative grid size-11 place-items-center rounded-full bg-[var(--accent)] font-display text-lg font-bold text-[var(--on-accent)]">{i + 1}</span>
              <h3 className="font-display mt-5 text-xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[var(--muted)]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
