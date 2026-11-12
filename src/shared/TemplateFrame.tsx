"use client";

import { useEffect, type ReactNode } from "react";
import Experience from "@/components/Experience";
import StickyCta from "@/components/ui/StickyCta";
import { useAppStore } from "@/lib/store";
import PreviewBack from "./PreviewBack";
import type { Story3DConfig } from "./story3d";

interface Props {
  id: string;
  /** Route prefix, e.g. "/t/editorial". */
  base: string;
  config: Story3DConfig;
  /** next/font variable classes of the template. */
  fontClass: string;
  /** False on pages without the hero/story canvas (the configurator brings its own preview). */
  scene?: boolean;
  /** False hides the "Back to templates" link that ?preview=1 shows (the eco template ships without it). */
  previewBack?: boolean;
  children: ReactNode;
}

/**
 * Root of every template page: applies the template's tokens (data-template), hands its 3D
 * settings to the shared engine, boots device detection + the shared canvas, and adds the
 * conversion features that every template keeps (sticky quote, WhatsApp, preview link).
 */
export default function TemplateFrame({ id, base, config, fontClass, scene = true, previewBack = true, children }: Props) {
  useEffect(() => {
    document.documentElement.setAttribute("data-template", id);
    useAppStore.getState().setStory3D(config);
  }, [id, config]);

  return (
    <div data-template={id} className={`${fontClass} min-h-dvh bg-[var(--bg)] pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-[var(--fg)] xl:pb-0`}>
      {/* sets the attribute before first paint so the page background matches (no flash) */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute("data-template",${JSON.stringify(id)})` }} />
      {scene && <Experience />}
      {children}
      <StickyCta base={base} />
      {previewBack && <PreviewBack />}
    </div>
  );
}
