import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import { legal } from "@/content/legal";
import { brand, contact } from "@/content/siteCore";

const doc = legal.privacy;
export const metadata: Metadata = pageMetadata(`${doc.title} | ${brand.name}`, doc.lead, "/privacy/");

export default function Page() {
  return (
    <Shell>
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-5xl">{doc.title}</h1>
          <p className="mt-3 text-sm font-semibold text-[var(--kraft-ink)]">{legal.updated}</p>
          <p className="mt-4 text-lg text-[var(--muted)]">{doc.lead}</p>
          {doc.sections.map((s) => (
            <section key={s.h} className="mt-8">
              <h2 className="font-display text-2xl font-medium">{s.h}</h2>
              <p className="mt-2 text-[var(--muted)]">{s.p}</p>
            </section>
          ))}
          <p className="mt-10 text-[var(--muted)]">Questions: <a className="underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a></p>
        </div>
      </section>
    </Shell>
  );
}
