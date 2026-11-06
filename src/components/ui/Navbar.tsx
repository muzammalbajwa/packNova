import Button from "./Button";

const LINKS = [
  { href: "#products", label: "Products" },
  { href: "#configurator", label: "Configurator" },
  { href: "#quote", label: "Quote" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav className="flex items-center gap-6 rounded-full border border-white/10 bg-black/50 px-5 py-2.5 backdrop-blur-md">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight">
          PackCo
        </a>
        <ul className="hidden items-center gap-5 text-sm text-[var(--muted)] md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Button href="#quote" className="!px-4 !py-2">
          Get a Quote
        </Button>
      </nav>
    </header>
  );
}
