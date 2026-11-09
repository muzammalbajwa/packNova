"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { ACCEPTED_TYPES, hasArt, loadArtwork, emptyPanel, type ArtMap, type Panel } from "@/lib/artwork";
import { PANELS, panelLabel, type ModelId } from "@/lib/configurator";

const S = site.configurator.studio;
const field =
  "w-full rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] px-4 py-3 text-base text-[var(--fg)] outline-none transition-colors focus:border-[var(--accent)]";

/** Per-panel artwork: image upload (validated), text and a background color. */
export default function ArtworkPanel({
  model,
  art,
  onChange,
}: {
  model: ModelId;
  art: ArtMap;
  onChange: (a: ArtMap) => void;
}) {
  const panels = PANELS[model];
  const [picked, setPicked] = useState<Panel>("front");
  const active: Panel = panels.includes(picked) ? picked : panels[0];
  const a = art[active];
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (p: Partial<typeof a>) => onChange({ ...art, [active]: { ...a, ...p } });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    const res = await loadArtwork(file);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    patch({ bitmap: res.bitmap, fileName: file.name });
  };

  return (
    <fieldset>
      <legend className="eyebrow mb-3">{S.artworkTitle}</legend>

      <div role="tablist" aria-label={S.panel} className="mb-4 flex flex-wrap gap-2">
        {panels.map((p) => (
          <button
            key={p}
            role="tab"
            type="button"
            aria-selected={p === active}
            onClick={() => {
              setPicked(p);
              setError(null);
            }}
            className={`rounded-[var(--r-btn)] border px-4 py-2 text-sm transition-colors ${
              p === active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                : "border-[var(--line)] text-[var(--fg)] hover:border-[var(--fg)]"
            }`}
          >
            {panelLabel(p)}
            {hasArt(art[p]) && <span aria-hidden className="ml-1.5 inline-block size-1.5 rounded-[var(--r-btn)] bg-current" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-[var(--r-btn)] border border-[var(--line)] px-5 py-2.5 text-sm transition-colors hover:border-[var(--fg)]">
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = ""; // allow re-selecting the same file
              }}
            />
            <span>{busy ? "Reading..." : S.upload}</span>
            <span className="text-xs text-[var(--muted)]">{S.uploadHelp}</span>
          </label>
          {a.bitmap && (
            <p className="mt-2 flex items-center gap-3 text-sm text-[var(--muted)]">
              <span className="truncate">{a.fileName}</span>
              <button type="button" onClick={() => patch({ bitmap: null, fileName: "" })} className="underline underline-offset-4 hover:text-[var(--fg)]">
                {S.removeImage}
              </button>
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-[var(--accent)]">
              {error}
            </p>
          )}
        </div>

        {a.bitmap && (
          <div className="flex gap-2" role="group" aria-label={S.fit}>
            {(["cover", "contain"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={a.fit === f}
                onClick={() => patch({ fit: f })}
                className={`rounded-[var(--r-btn)] border px-4 py-2 text-xs ${
                  a.fit === f ? "border-[var(--fg)] text-[var(--fg)]" : "border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                {f === "cover" ? S.fitCover : S.fitContain}
              </button>
            ))}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--muted)]">{S.text}</span>
          <textarea
            rows={2}
            maxLength={60}
            value={a.text}
            onChange={(e) => patch({ text: e.target.value })}
            className={field}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">{S.textColor}</span>
            <input
              type="color"
              value={a.textColor}
              onChange={(e) => patch({ textColor: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] p-1"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs text-[var(--muted)]">{S.background}</span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label={S.background}
                value={a.bg ?? "#bd9460"}
                onChange={(e) => patch({ bg: e.target.value })}
                className="h-11 w-16 cursor-pointer rounded-[var(--r-field)] border border-[var(--line)] bg-[var(--field)] p-1"
              />
              <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <input type="checkbox" checked={a.bg === null} onChange={(e) => patch({ bg: e.target.checked ? null : "#bd9460" })} className="accent-[var(--accent)]" />
                {S.useMaterialColor}
              </label>
            </div>
          </div>
        </div>

        {hasArt(a) && (
          <button
            type="button"
            onClick={() => onChange({ ...art, [active]: emptyPanel() })}
            className="self-start text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--fg)]"
          >
            {S.clearPanel}
          </button>
        )}
      </div>
    </fieldset>
  );
}
