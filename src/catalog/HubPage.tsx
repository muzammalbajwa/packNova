import Link from "next/link";
import { GROUP_BY_ID, pagesIn, quoteHref, type GroupId } from "@/content/catalog";
import Crumbs from "./Crumbs";
import Shell from "./Shell";

/** One group of the nav (/industry/ ...): a grid of cards, one per page. */
export default function HubPage({ group }: { group: GroupId }) {
  const g = GROUP_BY_ID[group];
  const pages = pagesIn(group);
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
                <Link href={p.href} className="group flex h-full flex-col p-6 transition-colors hover:bg-[var(--sand)] focus-visible:bg-[var(--sand)]">
                  <span className="font-display text-2xl font-medium leading-tight">{p.title}</span>
                  <span className="mt-2 text-[var(--muted)]">{p.short}</span>
                  <span className="mt-auto pt-5 text-base font-semibold text-[var(--accent)] group-hover:underline underline-offset-4">See how it is made →</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-[var(--muted)]">
            Not sure which one fits? <Link href={quoteHref()} className="font-semibold text-[var(--accent)] underline underline-offset-4">Tell us what you are packing</Link>.
          </p>
        </div>
      </section>
    </Shell>
  );
}
