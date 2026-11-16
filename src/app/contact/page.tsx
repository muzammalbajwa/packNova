import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import ContactForm from "@/components/contact/ContactForm";
import MapPlaceholder from "@/components/contact/MapPlaceholder";
import { contactPage as c } from "@/content/contactPage";
import { site } from "@/content/site";
import { localBusinessJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = pageMetadata(`Contact us | ${site.brand.name}`, c.lead, "/contact/");

export default function Page() {
  const k = site.contact;
  const link = "underline underline-offset-4 hover:text-[var(--accent)]";
  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()).replace(/</g, "\\u003c") }} />
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-6xl">{c.heading}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">{c.lead}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="grid content-start gap-8">
              <dl className="grid gap-4 text-lg">
                <div><dt className="text-sm font-semibold text-[var(--kraft-ink)]">Phone</dt><dd><a className={link} href={k.phoneHref}>{k.phone}</a></dd></div>
                <div><dt className="text-sm font-semibold text-[var(--kraft-ink)]">WhatsApp</dt><dd><a className={link} href={k.whatsappHref} target="_blank" rel="noopener noreferrer">{k.whatsapp}</a></dd></div>
                <div><dt className="text-sm font-semibold text-[var(--kraft-ink)]">Email</dt><dd><a className={link} href={`mailto:${k.email}`}>{k.email}</a></dd></div>
                <div><dt className="text-sm font-semibold text-[var(--kraft-ink)]">Address</dt><dd>{k.address}</dd></div>
                <div><dt className="text-sm font-semibold text-[var(--kraft-ink)]">Working hours</dt><dd>{k.hours}</dd></div>
              </dl>
              <MapPlaceholder />
            </div>
            <ContactForm />
          </div>

          <section aria-labelledby="faq-h" className="mt-16 border-t border-[var(--line)] pt-10">
            <h2 id="faq-h" className="font-display text-3xl font-medium">{c.faqHeading}</h2>
            <div className="mt-6 max-w-3xl border-t border-[var(--line-strong)]">
              {c.faq.map((f) => (
                <details key={f.q} className="group border-b border-[var(--line)] py-4">
                  <summary className="cursor-pointer list-none font-display text-xl font-medium marker:hidden [&::-webkit-details-marker]:hidden"><span className="mr-2 inline-block transition-transform group-open:rotate-90" aria-hidden>›</span>{f.q}</summary>
                  <p className="mt-3 max-w-2xl text-[var(--muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>
    </Shell>
  );
}
