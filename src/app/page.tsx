import type { Metadata } from "next";
import { site } from "@/content/site";
import { TEMPLATE_META } from "@/templates/registry";

export const metadata: Metadata = {
  title: `Choose a template | ${site.brand.name}`,
  robots: { index: false },
};

/**
 * Template picker (the site root). Four different designs of the same site: the same copy, the
 * same 3D "how your box is made" animation and the same quote/WhatsApp flow. No 3D loads here.
 */
export default function TemplatePicker() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">{site.brand.name} · website templates</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl">Pick the design you like best.</h1>
      <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
        Four templates with different layouts, type and motion. All four use the same copy, the same 3D making-of animation and the same quote flow.
        Open each one, scroll through it, then tell us your favorite.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2">
        {TEMPLATE_META.map((t, i) => (
          <li key={t.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)]">
            <a href={`/t/${t.id}/?preview=1`} className="block overflow-hidden border-b border-[var(--line)] bg-[var(--wash)]" tabIndex={-1} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/templates/${t.id}.jpg`}
                alt={`${t.name} template, home page`}
                width={1440}
                height={900}
                loading={i < 2 ? "eager" : "lazy"}
                className="aspect-[16/10] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </a>
            <div className="flex flex-1 flex-col p-6">
              <h2 className="text-2xl font-bold tracking-tight">
                <span className="mr-2 text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
                {t.name}
              </h2>
              <p className="mt-2 flex-1 text-[var(--muted)]">{t.blurb}</p>
              <a
                href={`/t/${t.id}/?preview=1`}
                className="mt-6 inline-flex w-fit items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--fg)]"
              >
                Open {t.name} →
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
