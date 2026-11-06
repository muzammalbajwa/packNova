const COLS = [
  { title: "Products", links: ["Corrugated", "Rigid Boxes", "Folding Cartons", "Pouches", "Poly Bags", "Courier Bags"] },
  { title: "Company", links: ["About", "Sustainability", "Careers", "Blog"] },
  { title: "Contact", links: ["hello@packco.example", "+1 (000) 000-0000", "1 Placeholder Way"] },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative z-10 border-t border-[var(--line)] bg-[var(--bg)] px-6 pb-10 pt-20">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="font-display text-3xl font-bold tracking-tight">
            Pack<span className="text-[var(--accent)]">Co</span>
          </p>
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">
            Placeholder company. Packaging designed, printed and delivered.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="eyebrow mb-4">{c.title}</h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              {c.links.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-16 max-w-6xl border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} PackCo (placeholder). All rights reserved.
      </p>
    </footer>
  );
}
