import { GROUP_BY_ID, HUB, hubChips, pagesIn, type GroupId } from "@/content/catalog";
import "./pageEnd.css";
import Crumbs from "./Crumbs";
import HubFilter from "./HubFilter";
import HubTeaser from "./HubTeaser";
import PrefetchLink from "./PrefetchLink";
import ProductIllustration from "./ProductIllustration";
import QuoteBand from "./QuoteBand";
import Shell from "./Shell";

/**
 * One group of the nav (/industry/ ...). Header with count and filter chips, an editorial grid (the first card is the feature card and spans two
 * columns), the "how it is made" strip, and the closing quote band. Cards are server-rendered, so the full list works without script.
 */
export default function HubPage({ group }: { group: GroupId }) {
  const g = GROUP_BY_ID[group];
  const pages = pagesIn(group);
  return (
    <Shell>
      <section className="px-6 pb-16 pt-10 md:pb-24">
        <div className="mx-auto max-w-6xl">
          <Crumbs trail={[{ label: "Home", href: "/" }, { label: g.label }]} />
          <h1 className="font-display mt-6 max-w-3xl text-balance text-4xl font-medium leading-[1.08] md:text-6xl">{g.heading}</h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">{g.lead}</p>
          <HubFilter chips={hubChips(group)} total={pages.length} noun={HUB.count[group]} labels={{ filter: HUB.filterLabel, all: HUB.all }} />

          <ul id="hub-grid" className="hub-grid mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p, i) => {
              const feature = i === 0;
              return (
                <li key={p.slug} data-tags={p.tags.join("|")} {...(feature ? { "data-feature": "", "data-wide": "" } : {})} className="hub-card" style={{ "--c": i % 3 } as React.CSSProperties}>
                  <PrefetchLink
                    recipe={p.recipe}
                    href={p.href}
                    className="rel-card group flex h-full flex-col overflow-hidden rounded-[var(--r-card)] border border-[var(--line-strong)] hub-link"
                    style={{ "--ic-base": p.skin.base, "--ic-accent": p.skin.accent === p.skin.base ? p.skin.second : p.skin.accent } as React.CSSProperties}
                  >
                    <span className="rel-plate hub-plate block w-full px-8 py-5"><ProductIllustration page={p} /></span>
                    <span className="flex flex-1 flex-col p-5 md:p-6">
                      <span className="hub-name font-display text-2xl font-medium leading-tight">{p.title}</span>
                      <span className="mt-1.5 text-[var(--muted)]">{p.short}</span>
                      {feature && (
                        <span className="hub-extra mt-5 hidden">
                          <span className="block max-w-md text-lg">{p.what}</span>
                          <span className="mt-5 block font-semibold text-[var(--kraft-ink)]">Good for</span>
                          <span className="mt-1 block text-[var(--muted)]">{p.uses.slice(0, 4).join(", ")}</span>
                        </span>
                      )}
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <span key={t} className="rounded-[var(--r-btn)] border border-[var(--line)] px-2.5 py-0.5 text-sm text-[var(--muted)]">{t}</span>
                        ))}
                      </span>
                      <span className="mt-auto flex items-center gap-2 pt-5 font-semibold text-[var(--accent)]">
                        {HUB.cardAction}
                        <span aria-hidden="true" className="rel-arrow inline-block">→</span>
                      </span>
                    </span>
                  </PrefetchLink>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <HubTeaser />
      <QuoteBand />
    </Shell>
  );
}
