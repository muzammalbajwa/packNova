"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import SpecControls from "@/components/ui/SpecControls";
import { defaultSpec, specToQuery } from "@/lib/configurator";
import { copy } from "./copy";

/** Text on the left, the real controls on the right in a bordered panel. */
export default function ConfiguratorTeaser({ base }: { base: string }) {
  const c = copy.configurator;
  const [spec, setSpec] = useState(defaultSpec);
  return (
    <section id="configurator" className="relative z-10 bg-[var(--sand)] px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div data-reveal="subtle">
          <h2 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{c.heading}</h2>
          <p className="mt-4 max-w-sm text-lg text-[var(--muted)]">{c.body}</p>
        </div>
        <div data-reveal="subtle" className="flex flex-col gap-7 rounded-[var(--r-card)] border border-[var(--line-strong)] bg-[var(--surface)] p-6 md:p-8">
          <SpecControls spec={spec} onChange={setSpec} />
          <div>
            <Button href={`${base}/configurator/?${specToQuery(spec)}`} track="configurator_teaser" className="!px-7 !py-3.5 !text-base !font-semibold">{c.cta}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
