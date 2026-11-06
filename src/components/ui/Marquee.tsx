const TAGS = ["Corrugated", "Rigid", "Folding Cartons", "Pouches", "Custom Print", "Eco-friendly"];

export default function Marquee() {
  return (
    <div
      className="relative z-10 overflow-hidden border-y border-[var(--line)] bg-[var(--bg)] py-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
      aria-hidden
    >
      {/* Two identical halves: translating -50% loops seamlessly. */}
      <div className="flex w-max [animation:marquee_32s_linear_infinite]">
        {[0, 1].map((n) => (
          <div key={n} className="flex shrink-0 items-center">
            {[...TAGS, ...TAGS].map((t, i) => (
              <span
                key={`${n}-${i}`}
                className="font-display flex items-center whitespace-nowrap px-8 text-3xl font-semibold uppercase tracking-tight text-[var(--fg)]/80 md:text-5xl"
              >
                {t}
                <span className="ml-16 inline-block size-2.5 rotate-45 bg-[var(--accent)]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
