"use client";

import { useEffect, useRef } from "react";
import Button from "./Button";

const LINKS = [
  { href: "#products", label: "Products" },
  { href: "/configurator/", label: "Configurator" },
  { href: "#quote", label: "Quote" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
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
        className="flex w-full max-w-3xl items-center justify-between gap-6 rounded-full border border-[var(--line)] bg-black/55 py-2 pl-6 pr-2 backdrop-blur-xl"
      >
        <a href="#top" className="font-display text-xl font-bold tracking-tight">
          Pack<span className="text-[var(--accent)]">Co</span>
        </a>
        <ul className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors duration-300 hover:text-[var(--fg)]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Button href="#quote" className="!px-5 !py-2.5">
          Get a Quote
        </Button>
      </nav>
    </header>
  );
}
