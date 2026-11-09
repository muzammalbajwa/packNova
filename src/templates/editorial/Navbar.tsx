"use client";

import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

/** Thin masthead: logo left, links centred, a plain underlined call to action right. */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>();
  return (
    <header
      ref={bar}
      className="fixed inset-x-0 top-0 z-50 border-b border-[var(--line-strong)] bg-[var(--glass)] backdrop-blur-md transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 xl:pr-52">
        <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="text-2xl">
          <Logo size={26} />
        </a>
        <ul className="hidden items-center gap-8 text-sm md:flex">
          {site.nav.links.map((l) => (
            <li key={l.label}>
              <a href={templateHref(base, l, onHome)} className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={templateHref(base, { hash: "quote" }, onHome)}
          className="hidden border-b border-[var(--fg)] pb-0.5 text-sm font-medium md:inline xl:hidden"
        >
          {site.nav.cta} →
        </a>
        <span className="w-6 md:hidden" aria-hidden />
      </nav>
    </header>
  );
}
