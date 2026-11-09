"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import ArtworkPanel from "@/components/ui/ArtworkPanel";
import Button from "@/components/ui/Button";
import ProductIcon from "@/components/ui/ProductIcon";
import QuoteHandoff from "@/components/ui/QuoteHandoff";
import SpecControls from "@/components/ui/SpecControls";
import { site } from "@/content/site";
import { track } from "@/lib/track";
import { emptyArt, type ArtMap } from "@/lib/artwork";
import { OPENABLE, specFromSearch, specLines, type Spec } from "@/lib/configurator";
import { detectDevice } from "@/lib/deviceTier";
import { buildQuoteText, whatsappUrl } from "@/lib/quoteMessage";
import { useAppStore } from "@/lib/store";
import { useDebouncedValue } from "@/lib/useDebounced";

const PreviewScene = dynamic(() => import("@/components/canvas/PreviewScene"), { ssr: false });

const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

function Studio({ initial }: { initial: Spec }) {
  const [spec, setSpec] = useState(initial);
  const [art, setArt] = useState<ArtMap>(emptyArt);
  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState<string | null>(null);
  const profile = useAppStore((s) => s.profile);
  const p = site.configurator.page;
  const S = site.configurator.studio;

  // Geometry and textures rebuild only after the inputs have settled (slider drags stay smooth).
  const liveSpec = useDebouncedValue(spec, 160);
  const liveArt = useDebouncedValue(art, 220);

  const item = site.products.items.find((i) => i.model === spec.model);
  const lines = useMemo(() => specLines(spec, art), [spec, art]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    useAppStore.getState().setProfile(detectDevice(), reduced);
  }, []);

  const requestQuote = () => {
    track("configurator_request_quote", { model: spec.model });
    const text = buildQuoteText({ product: item?.name, quantity: spec.quantity.toLocaleString("en-US"), spec: lines.join("\n") });
    setHandoff(text);
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  };

  const hasArtwork = lines.some((l) => l.startsWith("Artwork,"));

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-32 lg:grid-cols-[440px_1fr]">
      <div className="order-2 lg:order-1">
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 className="font-display mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.025em]">{p.heading}</h1>
        <div className="mt-8 flex flex-col gap-8">
          <SpecControls
            spec={spec}
            onChange={(s) => {
              setSpec(s);
              if (!OPENABLE[s.model]) setOpen(false);
            }}
            sliders
          />
          <ArtworkPanel model={spec.model} art={art} onChange={setArt} />
        </div>
      </div>

      <div className="order-1 flex flex-col gap-6 lg:order-2 lg:sticky lg:top-24 lg:self-start">
        <div className="relative h-[380px] overflow-hidden rounded-3xl border border-[var(--line)] bg-[radial-gradient(60%_60%_at_50%_45%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_70%)] lg:h-[540px]">
          {profile?.webgl ? (
            <PreviewScene spec={liveSpec} art={liveArt} open={open} />
          ) : (
            profile && (
              <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
                <div className="size-40 text-[var(--kraft-ink)]">
                  <ProductIcon kind={item?.icon ?? "corrugated"} />
                </div>
                <p className="max-w-xs text-sm text-[var(--muted)]">{S.noPreview}</p>
              </div>
            )
          )}
          {profile?.webgl && (
            <p className="pointer-events-none absolute bottom-4 left-5 text-xs text-[var(--muted)]">
              {S.hint}
              {profile.tier === "low" ? ` ${S.lowTier}` : ""}
            </p>
          )}
          {profile?.webgl && OPENABLE[spec.model] && (
            <button
              type="button"
              aria-pressed={open}
              onClick={() => setOpen((o) => !o)}
              className="absolute right-4 top-4 rounded-full border border-[var(--line)] bg-[var(--glass)] px-5 py-2.5 text-sm backdrop-blur transition-colors hover:border-[var(--fg)]"
            >
              {open ? S.close : S.open}
            </button>
          )}
        </div>

        <section aria-labelledby="spec-title" className="rounded-3xl border border-[var(--line)] p-6">
          <h2 id="spec-title" className="eyebrow mb-4">
            {S.summaryTitle}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {lines.map((l) => (
              <li key={l} className="text-[var(--muted)]">
                {l}
              </li>
            ))}
          </ul>
          {hasArtwork && <p className="mt-4 text-xs text-[var(--accent)]">{S.attachNote}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={requestQuote}
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--on-accent)] transition-colors duration-300 hover:bg-[var(--fg)]"
            >
              {S.quoteButton}
            </button>
            <Button href="/" variant="ghost">
              {p.back}
            </Button>
          </div>
        </section>

        {handoff && <QuoteHandoff text={handoff} onEdit={() => setHandoff(null)} />}
      </div>
    </div>
  );
}

/** Reads the spec handed over from the home-page teaser (?type=&l=&w=&h=&m=&q=). */
export default function ConfiguratorClient() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  // `key` remounts the studio when the URL spec arrives after hydration.
  return <Studio key={search} initial={specFromSearch(search)} />;
}
