import { copy } from "./copy";
import ProcessList from "./ProcessList";

/**
 * Heading column on the left (sticky from 1024 px, pure CSS), the four steps on the right. The columns are a grid with items-start, so the
 * pinned column is released when the list ends. See process.css; ProcessList marks the active step.
 */
export default function Process() {
  const c = copy.process;
  return (
    <section id="process" className="relative z-10 bg-[var(--bg)] px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="process-pin">
          <h2 className="font-display text-balance text-4xl font-medium leading-[1.1] md:text-5xl">{c.heading}</h2>
          <p className="mt-4 max-w-sm text-lg text-[var(--muted)]">{c.lead}</p>
        </div>
        <ProcessList>
          {c.steps.map((s, i) => (
            <li key={s.title} className="process-step grid gap-x-8 gap-y-1 border-b border-[var(--line)] py-6 sm:grid-cols-[3rem_1fr]">
              <span className="step-no font-display text-2xl text-[var(--kraft-ink)]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="step-title font-display text-2xl font-medium leading-tight">{s.title}</h3>
                <p className="step-body mt-2 max-w-lg text-[var(--muted)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ProcessList>
      </div>
    </section>
  );
}
