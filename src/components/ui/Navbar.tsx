"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { resolveHref } from "@/lib/links";
import Button from "./Button";
import Logo from "./Logo";

export default function Navbar({ fromHome = true }: { fromHome?: boolean }) {
  const bar = useRef<HTMLElement>(null);

  // Hide on scroll down, show on scroll up. Direct style mutation, no React state.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const hide = y > last && y > 160;
      if (bar.current) bar.current.style.transform = hide ? "translateY(-140%)" : "translateY(0)";
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={bar}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
    >
      <nav
        aria-label="Primary"
        className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-black/55 py-2 pl-5 pr-2 backdrop-blur-xl"
      >
        <a href={fromHome ? "#top" : "/"} aria-label={`${site.brand.name} home`} className="text-xl">
          <Logo />
        </a>
        <ul className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          {site.nav.links.map((l) => (
            <li key={l.label}>
              <a href={resolveHref(l, fromHome)} className="transition-colors duration-300 hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Button href={fromHome ? "#quote" : "/#quote"} className="!px-5 !py-2.5">
          {site.nav.cta}
        </Button>
      </nav>
    </header>
  );
}
