import { site } from "@/content/site";

export default function Process() {
  const { process } = site;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-5 pb-24 md:pb-36">
      <div className="mx-auto max-w-6xl">
        <p className="w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]">{process.eyebrow}</p>
        <h2 data-reveal className="font-display mt-5 max-w-3xl text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-7xl">{process.heading}</h2>
        <ol className="mt-14 grid gap-5 md:grid-cols-4">
          {process.steps.map((s, i) => (
            <li key={s.title} data-reveal className={`rounded-[var(--r-card)] p-6 ${i % 2 ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--surface)]"}`}>
              <span className={`grid size-14 place-items-center rounded-full font-display text-2xl font-extrabold ${i % 2 ? "bg-[var(--on-accent)] text-[var(--accent)]" : "bg-[var(--accent)] text-[var(--on-accent)]"}`}>{i + 1}</span>
              <h3 className="font-display mt-5 text-xl font-bold tracking-tight">{s.title}</h3>
              <p className={`mt-2 ${i % 2 ? "" : "text-[var(--muted)]"}`}>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
