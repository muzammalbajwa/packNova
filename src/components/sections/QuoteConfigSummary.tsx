"use client";

import { useEffect, useState } from "react";
import { ARTWORK_NOTE, paramsToConfig, summaryLines, type BoxConfig } from "@/lib/box";

/** On /quote/: the box that was designed in the configurator (read from the URL), as a table. Renders nothing otherwise. */
export default function QuoteConfigSummary() {
  const [cfg, setCfg] = useState<BoxConfig | null>(null);
  useEffect(() => {
    setCfg(paramsToConfig(new URLSearchParams(window.location.search))); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  if (!cfg) return null;
  return (
    <section aria-labelledby="cfg-h" className="mb-8 rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] p-5" data-testid="config-summary">
      <h2 id="cfg-h" className="font-display text-xl font-medium">The box you designed</h2>
      <table className="mt-3 w-full text-left text-[0.95rem]">
        <tbody>
          {summaryLines(cfg).map(([k, v]) => (
            <tr key={k} className="border-t border-[var(--line)]"><th scope="row" className="w-2/5 py-2 pr-3 align-top font-semibold">{k}</th><td className="py-2">{v}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-sm font-semibold">{ARTWORK_NOTE}</p>
    </section>
  );
}
