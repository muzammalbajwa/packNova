import Button from "../ui/Button";

export default function Quote() {
  return (
    <section id="quote" className="relative z-10 overflow-hidden bg-[var(--accent)] px-6 py-28 text-black md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.28em] opacity-70" data-reveal>
          Let&apos;s ship something
        </p>
        <h2
          data-reveal
          className="font-display mt-5 max-w-4xl text-[clamp(3rem,9vw,8rem)] font-bold leading-[0.92] tracking-[-0.035em]"
        >
          Get a quote in 24 hours.
        </h2>
        <div data-reveal className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="mailto:hello@packco.example?subject=Packaging%20quote"
            className="inline-flex items-center rounded-full bg-black px-8 py-4 text-base font-medium text-[var(--fg)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Request a quote
          </a>
          <Button href="tel:+10000000000" variant="ghost" className="!border-black/40 !text-black hover:!border-black">
            +1 (000) 000-0000
          </Button>
        </div>
      </div>
    </section>
  );
}
