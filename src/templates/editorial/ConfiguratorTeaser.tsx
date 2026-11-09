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
      <div className="mx-auto grid max-w-7xl gap-12 border-t border-[var(--fg)] pt-4 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <div data-reveal>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="font-display mt-6 text-5xl font-light leading-[0.98] tracking-[-0.025em] md:text-7xl">{c.heading}</h2>
          <p className="mt-6 max-w-sm text-lg text-[var(--muted)]">{c.body}</p>
        </div>
        <div data-reveal className="flex flex-col gap-7 bg-[var(--surface)] p-6 md:p-10">
          <SpecControls spec={spec} onChange={setSpec} />
          <div className="border-t border-[var(--line-strong)] pt-6">
            <Button href={`${base}/configurator/?${specToQuery(spec)}`} track="configurator_teaser">
              {c.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
