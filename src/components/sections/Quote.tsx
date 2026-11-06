import Button from "../ui/Button";

export default function Quote() {
  return (
    <section id="quote" className="relative z-10 bg-[var(--bg)] px-6 py-32">
      <h2 className="font-display text-4xl">Ready for a quote?</h2>
      <div className="mt-6">
        <Button href="mailto:hello@packco.example">Get a Quote</Button>
      </div>
    </section>
  );
}
