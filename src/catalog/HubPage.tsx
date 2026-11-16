import Link from "next/link";
import PrefetchLink from "./PrefetchLink";
import { GROUP_BY_ID, pagesIn, quoteHref, type GroupId } from "@/content/catalog";
import Crumbs from "./Crumbs";
import Shell from "./Shell";

/** One group of the nav (/industry/ ...): a grid of cards, one per page. */
export default function HubPage({ group }: { group: GroupId }) {
  const g = GROUP_BY_ID[group];
  const pages = pagesIn(group);
  // the last card fills whatever is left of the last row (so the grid never shows an empty grey cell) and carries the "not sure" question
  const SM = { 1: "sm:col-span-1", 2: "sm:col-span-2" }[pages.length % 2 === 0 ? 2 : 1];
  const LG = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3" }[pages.length % 3 === 0 ? 3 : 3 - (pages.length % 3)];
  return (
    <Shell>
      <section className="px-6 pb-20 pt-10 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <Crumbs trail={[{ label: "Home", href: "/" }, { label: g.label }]} />
          <h1 className="font-display mt-6 max-w-3xl text-4xl font-medium leading-[1.1] md:text-6xl">{g.heading}</h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">{g.lead}</p>
          <ul className="mt-12 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <li key={p.slug} className="bg-[var(--bg)]">
                <PrefetchLink recipe={p.recipe} href={p.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-[var(--sand)] focus-visible:bg-[var(--sand)]">
                  <span className="font-display text-2xl font-medium leading-tight">{p.title}</span>
                  <span className="mt-2 text-[var(--muted)]">{p.short}</span>
                  <span className="mt-auto pt-5 text-base font-semibold text-[var(--accent)] group-hover:underline underline-offset-4">See how it is made →</span>
                </PrefetchLink>
              </li>
            ))}
            <li className={`bg-[var(--sand)] ${SM} ${LG}`}>
              <Link href={quoteHref()} className="group flex h-full flex-col justify-center p-6 transition-colors hover:bg-[var(--wash)]">
                <span className="font-display text-2xl font-medium leading-tight">Not sure which one fits?</span>
                <span className="mt-2 text-[var(--muted)]">Tell us what you are packing and we will suggest one.</span>
                <span className="mt-4 text-base font-semibold text-[var(--accent)] group-hover:underline underline-offset-4">Get a quote →</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </Shell>
  );
}
