"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PrefetchLink from "@/catalog/PrefetchLink";
import { usePathname } from "next/navigation";
import { brand, contact, navCta, social } from "@/content/siteCore";
import { NAV, quoteHref as quoteLink } from "@/content/navData";
import Logo from "@/components/ui/Logo";
import { getLenis } from "@/lib/lenisRef";
import { track } from "@/lib/track";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Header: a slim contact bar, then the main bar with dropdown menus (Industry, Shape & style, Material, Event).
 * Dropdowns open on hover, click or Enter, close on Escape, outside click or when focus leaves; below lg a menu button
 * opens the same lists as accordions. Every item is a real page (src/content/catalog.ts).
 */
export default function Navbar({ base: _base, onHome: _onHome }: { base?: string; onHome?: boolean } = {}) {
  void _base; void _onHome;
  const path = usePathname();
  const bar = useHideOnScroll<HTMLElement>("translateY(-100%)");
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [acc, setAcc] = useState<number | null>(null);
  const wrap = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // while the mobile menu is open the page behind it does not scroll (Lenis is paused too)
  useEffect(() => {
    if (!mobile) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    getLenis()?.stop();
    return () => {
      html.style.overflow = prev;
      getLenis()?.start();
    };
  }, [mobile]);

  // a route change closes the menu
  useEffect(() => {
    setMobile(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [path]);

  const pick = (menu: string, item: string) => {
    track("nav_menu_click", { menu, item });
    setOpen(null);
    setMobile(false);
  };
  const quoteHref = quoteLink();
  const here = (href?: string) => (href ? path === href || path === href.replace(/\/$/, "") : false);

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 bg-[var(--bg)] transition-transform duration-300">
      {/* contact bar */}
      <div className="bg-[var(--accent)] text-[var(--on-accent)]">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-6 text-sm">
          <ul className="hidden items-center gap-4 sm:flex">
            {social.map((s) => (
              <li key={s.name}><a href={s.href} className="hover:underline underline-offset-4">{s.name}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-5">
            <a href={`mailto:${contact.email}`} className="hidden hover:underline underline-offset-4 sm:inline">{contact.email}</a>
            <a href={contact.phoneHref} className="whitespace-nowrap hover:underline underline-offset-4">{contact.phone}</a>
            <span className="hidden w-40 xl:block" aria-hidden />
          </div>
        </div>
      </div>

      {/* main bar */}
      <nav aria-label="Primary" className="relative border-b border-[var(--line)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" aria-label={`${brand.name} home`} className="text-xl">
            <Logo />
          </Link>

          <ul ref={wrap} className="hidden items-center gap-1 text-base lg:flex">
            {NAV.map((e, i) => (
              <li key={e.label} className="relative" onMouseEnter={() => e.items && setOpen(i)} onMouseLeave={() => setOpen((o) => (o === i ? null : o))}
                  onBlur={(ev) => { if (!ev.currentTarget.contains(ev.relatedTarget as Node)) setOpen((o) => (o === i ? null : o)); }}>
                {e.items ? (
                  <>
                    <button type="button" aria-expanded={open === i} aria-haspopup="true" onClick={() => setOpen(open === i ? null : i)}
                      className={`inline-flex items-center gap-1.5 rounded-[var(--r-btn)] px-3 py-2 transition-colors ${open === i ? "bg-[var(--sand)] text-[var(--fg)]" : "text-[var(--muted)] hover:text-[var(--fg)]"}`}>
                      {e.label}
                      <Chevron open={open === i} />
                    </button>
                    {open === i && (
                      <ul className="fade-in absolute left-0 top-full z-10 w-[min(32rem,90vw)] columns-2 gap-x-6 rounded-[var(--r-card)] border border-[var(--line-strong)] bg-[var(--surface)] p-3 shadow-[0_12px_28px_-18px_rgba(23,35,29,0.5)]">
                        {e.items.map((item) => (
                          <li key={item.href} className="break-inside-avoid">
                            <PrefetchLink recipe={item.recipe} href={item.href} onClick={() => pick(e.label, item.label)} aria-current={here(item.href) ? "page" : undefined} className="block rounded-[var(--r-field)] px-3 py-2 text-[var(--fg)] hover:bg-[var(--sand)] aria-[current=page]:font-semibold">
                              {item.label}
                            </PrefetchLink>
                          </li>
                        ))}
                        <li className="mt-1 break-inside-avoid border-t border-[var(--line)] pt-1">
                          <Link href={e.href!} onClick={() => pick(e.label, "all")} className="block rounded-[var(--r-field)] px-3 py-2 font-semibold text-[var(--accent)] hover:bg-[var(--sand)]">All {e.label.toLowerCase()} →</Link>
                        </li>
                      </ul>
                    )}
                  </>
                ) : (
                  <Link href={e.href!} aria-current={here(e.href) ? "page" : undefined} className="block rounded-[var(--r-btn)] px-3 py-2 text-[var(--muted)] transition-colors hover:text-[var(--fg)] aria-[current=page]:text-[var(--fg)] aria-[current=page]:font-semibold">{e.label}</Link>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link href={quoteHref} className="rounded-[var(--r-btn)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] xl:hidden">
              {navCta}
            </Link>
            <button type="button" aria-expanded={mobile} aria-controls="eco-mobile-menu" aria-label={mobile ? "Close menu" : "Open menu"} onClick={() => setMobile((m) => !m)}
              className="grid size-10 place-items-center rounded-[var(--r-btn)] border border-[var(--line-strong)] lg:hidden">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                {mobile ? <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
              </svg>
            </button>
            <span className="hidden w-40 xl:block" aria-hidden />
          </div>
        </div>

        {/* mobile menu */}
        {mobile && (
          <div id="eco-mobile-menu" className="fade-in max-h-[calc(100dvh-6.25rem)] overflow-y-auto overscroll-contain border-t border-[var(--line)] bg-[var(--bg)] px-6 pb-6 lg:hidden">
            <ul>
              {NAV.map((e, i) => (
                <li key={e.label} className="border-b border-[var(--line)]">
                  {e.items ? (
                    <>
                      <button type="button" aria-expanded={acc === i} onClick={() => setAcc(acc === i ? null : i)} className="flex w-full items-center justify-between py-3.5 text-left text-lg font-medium">
                        {e.label}
                        <Chevron open={acc === i} />
                      </button>
                      {acc === i && (
                        <ul className="grid grid-cols-2 gap-x-4 pb-3">
                          {e.items.map((item) => (
                            <li key={item.href}>
                              <PrefetchLink recipe={item.recipe} href={item.href} onClick={() => pick(e.label, item.label)} className="block py-2 text-[var(--muted)]">{item.label}</PrefetchLink>
                            </li>
                          ))}
                          <li className="col-span-2"><Link href={e.href!} onClick={() => pick(e.label, "all")} className="block py-2 font-semibold text-[var(--accent)]">All {e.label.toLowerCase()} →</Link></li>
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link href={e.href!} onClick={() => setMobile(false)} className="block py-3.5 text-lg font-medium">{e.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
