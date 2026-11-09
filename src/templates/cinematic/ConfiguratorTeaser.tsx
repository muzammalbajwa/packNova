"use client";

import { useState } from "react";
import { site } from "@/content/site";
import Button from "@/components/ui/Button";
import SpecControls from "@/components/ui/SpecControls";
import { defaultSpec, specToQuery } from "@/lib/configurator";

export default function ConfiguratorTeaser({ base }: { base: string }) {
  const c = site.configurator;
  const [spec, setSpec] = useState(defaultSpec);
  return (
    <section id="configurator" className="relative z-10 bg-[var(--bg)] px-6 pb-28 md:pb-40">
      <div className="glass relative mx-auto grid max-w-6xl gap-12 overflow-hidden rounded-[var(--r-card)] p-8 md:grid-cols-2 md:p-14">
        <span className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-[var(--accent)] opacity-15 blur-3xl" aria-hidden />
        <div data-reveal className="relative">
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="font-display mt-4 text-5xl font-bold leading-[0.95] tracking-[-0.035em] md:text-6xl">{c.heading}</h2>
          <p className="mt-5 max-w-sm text-[var(--muted)]">{c.body}</p>
        </div>
        <div data-reveal className="relative flex flex-col gap-7">
          <SpecControls spec={spec} onChange={setSpec} />
          <div className="border-t border-[var(--line)] pt-6">
            <Button href={`${base}/configurator/?${specToQuery(spec)}`} track="configurator_teaser">{c.cta}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
