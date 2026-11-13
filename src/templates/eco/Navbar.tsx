"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { useAppStore } from "@/lib/store";
import { track } from "@/lib/track";
import { templateHref } from "@/shared/links";
import { useHideOnScroll } from "@/shared/useHideOnScroll";

type Entry = (typeof site.navMenu)[number];

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
 * opens the same lists as accordions. No page exists for the menu items yet, so each one opens the quote form with a note.
 */
export default function Navbar({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const bar = useHideOnScroll<HTMLElement>("translateY(-100%)");
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [acc, setAcc] = useState<number | null>(null);
  const wrap = useRef<HTMLUListElement>(null);
  const { contact } = site;

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

  const pick = (menu: string, item: string) => {
    useAppStore.getState().setQuotePrefill({ note: `${site.navNote} ${item}` });
    track("nav_menu_click", { menu, item });
    setOpen(null);
    setMobile(false);
  };
  const quoteHref = templateHref(base, { hash: "quote" }, onHome);
  const hrefOf = (e: Entry) => templateHref(base, { hash: e.hash }, onHome);

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 bg-[var(--bg)] transition-transform duration-300">
      {/* contact bar */}
      <div className="bg-[var(--accent)] text-[var(--on-accent)]">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-6 text-sm">
          <ul className="flex items-center gap-4">
            {site.social.map((s) => (
              <li key={s.name}><a href={s.href} className="hover:underline underline-offset-4">{s.name}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-5">
            <a href={`mailto:${contact.email}`} className="hidden hover:underline underline-offset-4 sm:inline">{contact.email}</a>
            <a href={contact.phoneHref} className="hover:underline underline-offset-4">{contact.phone}</a>
            <span className="hidden w-40 xl:block" aria-hidden />
          </div>
        </div>
      </div>

      {/* main bar */}
      <nav aria-label="Primary" className="relative border-b border-[var(--line)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <a href={onHome ? "#top" : `${base}/`} aria-label={`${site.brand.name} home`} className="text-xl">
            <Logo />
          </a>

          <ul ref={wrap} className="hidden items-center gap-1 text-base lg:flex">
            {site.navMenu.map((e, i) => (
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
                          <li key={item} className="break-inside-avoid">
                            <a href={quoteHref} onClick={() => pick(e.label, item)} className="block rounded-[var(--r-field)] px-3 py-2 text-[var(--fg)] hover:bg-[var(--sand)]">
                              {item}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <a href={hrefOf(e)} className="block rounded-[var(--r-btn)] px-3 py-2 text-[var(--muted)] transition-colors hover:text-[var(--fg)]">{e.label}</a>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a href={quoteHref} className="rounded-[var(--r-btn)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] xl:hidden">
              {site.nav.cta}
            </a>
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
          <div id="eco-mobile-menu" className="fade-in max-h-[calc(100dvh-6.25rem)] overflow-y-auto border-t border-[var(--line)] bg-[var(--bg)] px-6 pb-6 lg:hidden">
            <ul>
              {site.navMenu.map((e, i) => (
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
                            <li key={item}>
                              <a href={quoteHref} onClick={() => pick(e.label, item)} className="block py-2 text-[var(--muted)]">{item}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <a href={hrefOf(e)} onClick={() => setMobile(false)} className="block py-3.5 text-lg font-medium">{e.label}</a>
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
