"use client";

import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

/** Floating glass pill, centred. */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>();
  return (
    <header ref={bar} className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]">
      <nav aria-label="Primary" className="glass flex w-full max-w-3xl items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2">
        <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="text-xl">
          <Logo />
        </a>
        <ul className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          {site.nav.links.map((l) => (
            <li key={l.label}>
              <a href={templateHref(base, l, onHome)} className="transition-colors duration-300 hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={templateHref(base, { hash: "quote" }, onHome)}
          className="rounded-[var(--r-btn)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--on-accent)] xl:hidden"
        >
          {site.nav.cta}
        </a>
        <span className="hidden w-32 xl:block" aria-hidden />
      </nav>
    </header>
  );
}
