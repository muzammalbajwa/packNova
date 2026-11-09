import { site } from "@/content/site";

export default function Process() {
  const { process } = site;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-6 py-28 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-t border-[var(--fg)] pt-4 md:grid-cols-[1fr_2fr]">
          <p className="eyebrow">{process.eyebrow}</p>
          <h2 data-reveal className="font-display max-w-3xl text-5xl font-light leading-[0.98] tracking-[-0.025em] md:text-7xl">
            {process.heading}
          </h2>
        </div>
        <ol className="mt-20 grid gap-12 md:grid-cols-4 md:gap-0">
          {process.steps.map((s, i) => (
            <li key={s.title} data-reveal className="border-l border-[var(--line-strong)] pl-6 md:pr-8">
              <span className="font-display text-5xl font-extralight italic text-[var(--accent)]">{i + 1}</span>
              <h3 className="font-display mt-6 text-2xl font-normal tracking-tight">{s.title}</h3>
              <p className="mt-3 text-[var(--muted)]">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
