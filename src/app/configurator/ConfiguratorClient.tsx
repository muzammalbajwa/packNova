"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import SpecControls from "@/components/ui/SpecControls";
import Button from "@/components/ui/Button";
import { site } from "@/content/site";
import { detectDevice } from "@/lib/deviceTier";
import { specFromSearch, type Spec } from "@/lib/configurator";
import { useAppStore } from "@/lib/store";
import ProductIcon from "@/components/ui/ProductIcon";

const PreviewScene = dynamic(() => import("@/components/canvas/PreviewScene"), { ssr: false });

const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

function Studio({ initial }: { initial: Spec }) {
  const [spec, setSpec] = useState(initial);
  const profile = useAppStore((s) => s.profile);
  const p = site.configurator.page;
  const icon = site.products.items.find((i) => i.model === spec.model)?.icon ?? "corrugated";
  const material = site.configurator.materials.find((m) => m.id === spec.material)?.label;
  const typeName = site.products.items.find((i) => i.model === spec.model)?.name;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    useAppStore.getState().setProfile(detectDevice(), reduced);
  }, []);

  const mailto = `mailto:${site.contact.email}?subject=${encodeURIComponent(`Quote request: ${typeName}`)}&body=${encodeURIComponent(
    `Type: ${typeName}\nSize (cm): ${spec.l} x ${spec.w} x ${spec.h}\nMaterial: ${material}\n\n${site.quote.fields.quantity}: `,
  )}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-32 lg:grid-cols-[420px_1fr]">
      <div>
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 className="font-display mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.025em]">{p.heading}</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{p.note}</p>
        <div className="mt-8">
          <SpecControls spec={spec} onChange={setSpec} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={mailto}>{p.sendSpecs}</Button>
          <Button href="/" variant="ghost">
            {p.back}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-[var(--line)] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(255,91,46,0.12),transparent_70%)] lg:min-h-[640px]">
        {profile?.webgl ? (
          <PreviewScene spec={spec} />
        ) : (
          profile && (
            <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="size-40 text-[var(--kraft)]">
                <ProductIcon kind={icon} />
              </div>
              <p className="max-w-xs text-sm text-[var(--muted)]">{p.noWebgl}</p>
            </div>
          )
        )}
        <p className="pointer-events-none absolute bottom-4 left-5 text-xs text-[var(--muted)]">
          {typeName} / {spec.l} x {spec.w} x {spec.h} cm / {material}
        </p>
      </div>
    </div>
  );
}

/** Reads the spec handed over from the home-page teaser (?type=&l=&w=&h=&m=). */
export default function ConfiguratorClient() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  // `key` remounts the studio when the URL spec arrives after hydration.
  return <Studio key={search} initial={specFromSearch(search)} />;
}

