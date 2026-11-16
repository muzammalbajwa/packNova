"use client";

import { usePathname } from "next/navigation";
import { contact, messageIntro, navCta } from "@/content/siteCore";
import { track } from "@/lib/track";

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" />
      <path d="M9 8.6c0 3.4 2.9 6.4 6.4 6.4l1-1.6-2-1-.9.9c-.9-.4-1.9-1.4-2.3-2.3l.9-.9-1-2z" />
    </svg>
  );
}

/**
 * Always-visible ways to start a quote. Below xl: a bottom bar (quote + WhatsApp). From xl: a
 * "Get a quote" pill top right and a floating WhatsApp button bottom right. Nothing pops up,
 * nothing blocks the page. The WhatsApp number comes from content/site.ts.
 */
export default function StickyCta({ base = "" }: { base?: string }) {
  const path = usePathname().replace(/\/$/, "");
  const onHome = path === base || path === "";
  const quoteHref = onHome ? "#quote" : base === "" ? "/quote/" : `${base}/#quote`;
  const wa = `${contact.whatsappHref}?text=${encodeURIComponent(messageIntro)}`;
  const label = navCta;
  if (path === "/quote") return null; // the quote form has its own buttons; the bar would cover them on phones

  const quote = (place: string) => () => track("sticky_quote_click", { place });
  const chat = (place: string) => () => track("whatsapp_float_click", { place });

  return (
    <>
      {/* xl and up */}
      <a
        href={quoteHref}
        onClick={quote("top-right")}
        className="fixed right-5 top-[1.1rem] z-[60] hidden items-center rounded-[var(--r-btn)] bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--on-accent)] ring-2 ring-[var(--bg)] shadow-[0_6px_24px_-8px_rgba(0,0,0,0.45)] transition-colors duration-300 hover:bg-[var(--fg)] xl:inline-flex"
      >
        {label}
      </a>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
        onClick={chat("float")}
        className="fixed bottom-6 right-6 z-40 hidden size-14 place-items-center rounded-[var(--r-btn)] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--fg)] shadow-[0_8px_28px_-10px_rgba(0,0,0,0.5)] transition-colors hover:border-[var(--fg)] xl:grid"
      >
        <WhatsAppGlyph />
      </a>

      {/* below xl: bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-[var(--line)] bg-[var(--glass)] px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl xl:hidden">
        <a
          href={quoteHref}
          onClick={quote("bottom-bar")}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-[var(--r-btn)] bg-[var(--accent)] text-base font-medium text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]"
        >
          {label}
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          onClick={chat("bar")}
          className="grid size-12 shrink-0 place-items-center rounded-[var(--r-btn)] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--fg)] transition-colors hover:border-[var(--fg)]"
        >
          <WhatsAppGlyph />
        </a>
      </div>
    </>
  );
}
