"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { defaultSpec, specToQuery } from "@/lib/configurator";
import Button from "../ui/Button";
import SpecControls from "../ui/SpecControls";

/** Teaser: collects a spec and hands it to the /configurator/ page via the URL. */
export default function Configurator() {
  const c = site.configurator;
  const [spec, setSpec] = useState(defaultSpec);

  return (
    <section id="configurator" className="relative z-10 bg-[var(--bg)] px-6 pb-28 md:pb-40">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-3xl border border-[var(--line)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--kraft)_12%,transparent),transparent_60%)] p-8 md:grid-cols-2 md:p-14">
        <div data-reveal>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="font-display mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.025em] md:text-6xl">
            {c.heading}
          </h2>
          <p className="mt-5 max-w-sm text-[var(--muted)]">{c.body}</p>
        </div>

        <div data-reveal className="flex flex-col gap-7">
          <SpecControls spec={spec} onChange={setSpec} />
          <div className="border-t border-[var(--line)] pt-6">
            <Button href={`/configurator/?${specToQuery(spec)}`} track="configurator_teaser">{c.cta}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
