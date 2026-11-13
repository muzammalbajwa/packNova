import type { Metadata } from "next";
import Shell from "@/catalog/Shell";
import { pageMetadata } from "@/catalog/seo";
import { site } from "@/content/site";

export const metadata: Metadata = pageMetadata(`Contact us | ${site.brand.name}`, "Phone, WhatsApp, email and address.", "/contact/");

/** Phase 1 version: contact details. Expanded (FAQ, map placeholder, form) in phase 5. */
export default function Page() {
  const c = site.contact;
  return (
    <Shell>
      <section className="px-6 pb-24 pt-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-medium leading-[1.1] md:text-6xl">Contact us</h1>
          <ul className="mt-8 space-y-2 text-lg">
            <li><a className="underline underline-offset-4" href={c.phoneHref}>{c.phone}</a></li>
            <li><a className="underline underline-offset-4" href={c.whatsappHref}>WhatsApp: {c.whatsapp}</a></li>
            <li><a className="underline underline-offset-4" href={`mailto:${c.email}`}>{c.email}</a></li>
            <li>{c.address}</li>
            <li>{c.hours}</li>
          </ul>
        </div>
      </section>
    </Shell>
  );
}
