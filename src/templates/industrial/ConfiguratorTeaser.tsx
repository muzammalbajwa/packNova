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
    <section id="configurator" className="relative z-10 grid-paper px-5 pb-24 md:px-10 md:pb-36">
      <div className="border border-[var(--fg)] bg-[var(--surface)]">
        <p className="mono border-b border-[var(--fg)] bg-[var(--fg)] px-4 py-2 text-xs uppercase text-[var(--bg)]">§ 05 — {c.eyebrow}</p>
        <div className="grid gap-10 p-6 md:grid-cols-[1fr_1.3fr] md:p-10">
          <div data-reveal>
            <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[-0.04em] md:text-6xl">{c.heading}</h2>
            <p className="mt-5 max-w-sm text-[var(--muted)]">{c.body}</p>
          </div>
          <div data-reveal className="flex flex-col gap-7">
            <SpecControls spec={spec} onChange={setSpec} />
            <div className="border-t border-[var(--fg)] pt-6">
              <Button href={`${base}/configurator/?${specToQuery(spec)}`} track="configurator_teaser" className="mono uppercase">{c.cta} →</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
