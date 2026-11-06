const TAGS = ["Corrugated", "Rigid", "Folding Cartons", "Pouches", "Custom Print", "Eco-friendly"];

export default function Marquee() {
  // The list is rendered twice so translating -50% loops seamlessly.
  const row = [...TAGS, ...TAGS];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[var(--bg)] py-5" aria-hidden>
      <div className="flex w-max gap-10 [animation:marquee_28s_linear_infinite]">
        {[0, 1].map((n) => (
          <div key={n} className="flex gap-10">
            {row.map((t, i) => (
              <span key={`${n}-${i}`} className="font-display text-2xl uppercase tracking-wide text-[var(--muted)]">
                {t} <span className="text-[var(--accent)]">/</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
