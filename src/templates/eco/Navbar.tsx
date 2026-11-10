"use client";

import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

/** A chunky rounded bar with pill links. */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>("translateY(-150%)");
  return (
    <header ref={bar} className="fixed inset-x-0 top-3 z-50 px-3 transition-transform duration-500 [transition-timing-function:var(--spring)]">
      <nav aria-label="Primary" className="mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-[var(--r-btn)] bg-[var(--surface)] py-2 pl-5 pr-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
        <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="text-xl">
          <Logo />
        </a>
        <ul className="hidden items-center gap-1 text-sm md:flex">
          {site.nav.links.map((l) => (
            <li key={l.label}>
              <a href={templateHref(base, l, onHome)} className="rounded-full px-4 py-2 text-[var(--muted)] transition-colors hover:bg-[var(--wash)] hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={templateHref(base, { hash: "quote" }, onHome)} className="rounded-[var(--r-btn)] bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-[var(--on-accent)] xl:hidden">
          {site.nav.cta}
        </a>
        <span className="hidden w-32 xl:block" aria-hidden />
      </nav>
    </header>
  );
}
