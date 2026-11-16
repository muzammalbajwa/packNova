"use client";

import { useEffect, type ReactNode } from "react";
import StickyCta from "@/components/ui/StickyCta";

/**
 * Root of every page that has no hero or story canvas (product pages, hubs, configurator, quote, contact, 404): the template's
 * tokens and fonts, and the sticky quote bar. It does not start smooth scroll, the loader or the homepage 3D engine
 * (those belong to the homepage), so GSAP, Lenis, zustand and the loader are not downloaded here.
 */
export default function PageFrame({ id, fontClass, children }: { id: string; fontClass: string; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-template", id);
  }, [id]);
  return (
    <div data-template={id} className={`${fontClass} [font-family:var(--f-body)] min-h-dvh bg-[var(--bg)] pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-[var(--fg)] xl:pb-0`}>
      {/* sets the attribute before first paint so the page background matches (no flash) */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute("data-template",${JSON.stringify(id)})` }} />
      {children}
      <StickyCta base="" />
    </div>
  );
}
