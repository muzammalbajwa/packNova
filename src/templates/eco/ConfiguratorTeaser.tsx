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
    <section id="configurator" className="relative z-10 bg-[var(--bg)] px-5 pb-24 md:pb-36">
      <div className="relative mx-auto grid max-w-6xl gap-10 overflow-hidden rounded-[2.5rem] bg-[var(--surface)] p-7 md:grid-cols-2 md:p-14">
        <span className="morph pointer-events-none absolute -right-24 -top-24 size-80 bg-[var(--accent)] opacity-20" aria-hidden />
        <div data-reveal className="relative">
          <p className="w-fit rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--on-accent)]">{c.eyebrow}</p>
          <h2 className="font-display mt-5 text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] md:text-6xl">{c.heading}</h2>
          <p className="mt-5 max-w-sm text-[var(--muted)]">{c.body}</p>
        </div>
        <div data-reveal className="relative flex flex-col gap-7">
          <SpecControls spec={spec} onChange={setSpec} />
          <div className="pt-2">
            <Button href={`${base}/configurator/?${specToQuery(spec)}`} track="configurator_teaser" className="!px-8 !py-4 !text-base font-bold">{c.cta}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
