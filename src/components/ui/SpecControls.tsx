"use client";

import { site } from "@/content/site";
import {
  DEFAULT_DIMS,
  LIMITS,
  MODELS,
  QUANTITY_LIMITS,
  clampDim,
  type MaterialId,
  type ModelId,
  type Spec,
} from "@/lib/configurator";

const L = site.configurator.labels;

const inputCls =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--field)] px-4 py-3 text-base text-[var(--fg)] outline-none transition-colors focus:border-[var(--accent)]";

/** Shared by the home-page teaser and the configurator page. `sliders` adds range inputs for the size. */
export default function SpecControls({
  spec,
  onChange,
  sliders = false,
}: {
  spec: Spec;
  onChange: (s: Spec) => void;
  sliders?: boolean;
}) {
  const dim = (key: "l" | "w" | "h", label: string) => {
    const [min, max] = LIMITS[spec.model][key];
    return (
      <label className="block">
        <span className="mb-1.5 flex justify-between text-xs text-[var(--muted)]">
          <span>{label}</span>
          <span className="tabular-nums">
            {min}-{max}
          </span>
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={spec[key]}
          onChange={(e) => onChange({ ...spec, [key]: clampDim(spec.model, key, Number(e.target.value) || min) })}
          className={inputCls}
        />
        {sliders && (
          <input
            type="range"
            aria-label={`${label} slider`}
            min={min}
            max={max}
            step={0.5}
            value={spec[key]}
            onChange={(e) => onChange({ ...spec, [key]: clampDim(spec.model, key, Number(e.target.value)) })}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        )}
      </label>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <label className="block">
        <span className="eyebrow mb-3 block">{L.type}</span>
        <select
          value={spec.model}
          onChange={(e) => {
            const model = e.target.value as ModelId;
            const [l, w, h] = DEFAULT_DIMS[model];
            onChange({ ...spec, model, l, w, h });
          }}
          className={inputCls}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-[var(--surface)]">
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="eyebrow mb-3">{L.size}</legend>
        <div className="grid grid-cols-3 gap-3">
          {dim("l", L.length)}
          {dim("w", L.width)}
          {dim("h", L.height)}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">{L.material}</legend>
        <div className="flex flex-wrap gap-2">
          {site.configurator.materials.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={spec.material === m.id}
              onClick={() => onChange({ ...spec, material: m.id as MaterialId })}
              className={`rounded-full border px-5 py-2.5 text-sm transition-colors duration-300 ${
                spec.material === m.id
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                  : "border-[var(--line)] text-[var(--fg)] hover:border-[var(--fg)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="eyebrow mb-3 block">{L.quantity}</span>
        <input
          type="number"
          inputMode="numeric"
          min={QUANTITY_LIMITS[0]}
          max={QUANTITY_LIMITS[1]}
          value={spec.quantity}
          onChange={(e) =>
            onChange({
              ...spec,
              quantity: Math.min(QUANTITY_LIMITS[1], Math.max(QUANTITY_LIMITS[0], Math.round(Number(e.target.value)) || 1)),
            })
          }
          className={inputCls}
        />
      </label>
    </div>
  );
}
