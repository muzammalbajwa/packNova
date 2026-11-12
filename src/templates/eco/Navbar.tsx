"use client";

import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

/** A flat bar on the cream page with a 1px rule underneath. */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>("translateY(-100%)");
  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line)] bg-[var(--bg)] transition-transform duration-300">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="text-xl">
          <Logo />
        </a>
        <ul className="hidden items-center gap-7 text-base md:flex">
          {site.nav.links.map((l) => (
            <li key={l.label}>
              <a href={templateHref(base, l, onHome)} className="py-2 text-[var(--muted)] transition-colors hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={templateHref(base, { hash: "quote" }, onHome)} className="rounded-[var(--r-btn)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] xl:hidden">
          {site.nav.cta}
        </a>
        <span className="hidden w-40 xl:block" aria-hidden />
      </nav>
    </header>
  );
}
