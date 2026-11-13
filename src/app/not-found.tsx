import Link from "next/link";
import Shell from "@/catalog/Shell";
import { GROUPS } from "@/content/catalog";

export default function NotFound() {
  return (
    <Shell>
      <section className="px-6 pb-24 pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-xl text-[var(--kraft-ink)]">404</p>
          <h1 className="font-display mt-2 text-4xl font-medium leading-[1.1] md:text-6xl">This page is not here.</h1>
          <p className="mt-4 max-w-lg text-lg text-[var(--muted)]">The link may be old or mistyped. Try one of these.</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {[{ label: "Home", href: "/" }, ...GROUPS.map((g) => ({ label: g.label, href: g.href })), { label: "Get a quote", href: "/quote/" }].map((l) => (
              <li key={l.href}><Link href={l.href} className="inline-flex rounded-[var(--r-btn)] border border-[var(--line-strong)] px-5 py-2.5 font-semibold hover:bg-[var(--sand)]">{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </section>
    </Shell>
  );
}
