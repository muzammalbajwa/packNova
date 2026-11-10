"use client";

import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

/** A drawing-sheet title bar: hard borders, numbered mono links. */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>();
  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 border-b border-[var(--fg)] bg-[var(--bg)] transition-transform duration-200 ease-linear">
      <nav aria-label="Primary" className="flex h-14 items-stretch justify-between">
        <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="flex items-center border-r border-[var(--fg)] px-5 text-lg">
          <Logo size={24} />
        </a>
        <ul className="mono hidden flex-1 items-stretch text-xs uppercase md:flex">
          {site.nav.links.map((l, i) => (
            <li key={l.label} className="border-r border-[var(--line-strong)]">
              <a href={templateHref(base, l, onHome)} className="flex h-full items-center gap-2 px-5 transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)]">
                <span className="text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span> {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={templateHref(base, { hash: "quote" }, onHome)} className="mono flex items-center bg-[var(--accent)] px-5 text-xs font-medium uppercase text-[var(--on-accent)] xl:hidden">
          {site.nav.cta}
        </a>
        <span className="hidden w-48 xl:block" aria-hidden />
      </nav>
    </header>
  );
}
