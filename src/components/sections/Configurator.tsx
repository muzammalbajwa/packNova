"use client";

import { useState } from "react";
import Button from "../ui/Button";

const SIZES = ["Small", "Medium", "Large"];
const MATERIALS = ["Kraft", "White", "Black"];
const QUANTITIES = ["500", "2,000", "10,000"];

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(o)}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 ${
              value === o
                ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                : "border-[var(--line)] text-[var(--fg)] hover:border-[var(--fg)]"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Teaser only: the full configurator is a future page. */
export default function Configurator() {
  const [size, setSize] = useState(SIZES[1]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [qty, setQty] = useState(QUANTITIES[1]);

  return (
    <section id="configurator" className="relative z-10 bg-[var(--bg)] px-6 pb-28 md:pb-40">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-3xl border border-[var(--line)] bg-[linear-gradient(135deg,rgba(201,165,116,0.08),transparent_60%)] p-8 md:grid-cols-2 md:p-14">
        <div data-reveal>
          <p className="eyebrow">Configurator</p>
          <h2 className="font-display mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.025em] md:text-6xl">
            Build your box in 30 seconds.
          </h2>
          <p className="mt-5 max-w-sm text-[var(--muted)]">
            Pick a size, material and run. The full 3D configurator is coming soon; this is a preview.
          </p>
        </div>

        <div data-reveal className="flex flex-col gap-7">
          <Choice label="Size" options={SIZES} value={size} onChange={setSize} />
          <Choice label="Material" options={MATERIALS} value={material} onChange={setMaterial} />
          <Choice label="Quantity" options={QUANTITIES} value={qty} onChange={setQty} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
            <p className="text-sm text-[var(--muted)]" aria-live="polite">
              {size} / {material} / {qty} units
            </p>
            <Button href="/configurator/">Open configurator</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
