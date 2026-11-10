import { site } from "@/content/site";

export default function Process() {
  const { process } = site;
  return (
    <section id="process" className="relative z-10 grid-paper px-5 pb-24 md:px-10 md:pb-36">
      <p className="eyebrow uppercase">§ 04 — {process.eyebrow}</p>
      <h2 data-reveal className="font-display mt-4 max-w-4xl text-5xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-7xl">{process.heading}</h2>
      <ol className="mt-14 grid border border-[var(--fg)] bg-[var(--surface)] md:grid-cols-4">
        {process.steps.map((s, i) => (
          <li key={s.title} data-reveal className="border-b border-[var(--fg)] p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
            <p className="mono text-xs uppercase text-[var(--accent)]">STEP {String(i + 1).padStart(2, "0")} / {String(process.steps.length).padStart(2, "0")}</p>
            <h3 className="font-display mt-4 text-2xl font-bold uppercase tracking-tight">{s.title}</h3>
            <p className="mt-3 text-[var(--muted)]">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
