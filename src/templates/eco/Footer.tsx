import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { GROUPS, HOME_CATEGORY_HREF, ROUTES } from "@/content/catalog";

/**
 * Four columns (brand, products, explore, contact) over a bottom bar (copyright, legal links, back to top). Thin kraft rules and serif
 * headings, like the cards above it. All text comes from site.ts and catalog.ts.
 */
export default function Footer({ base: _b, onHome: _o }: { base?: string; onHome?: boolean } = {}) {
  void _b; void _o;
  const { footer, contact } = site;
  const link = "inline-block py-0.5 hover:text-[var(--fg)] hover:underline underline-offset-4";
  const head = "font-display mb-4 border-b border-[color-mix(in_srgb,var(--kraft)_60%,transparent)] pb-2 text-xl font-medium";
  const explore = [...GROUPS.map((g) => ({ label: g.label, href: g.href })), { label: "Design your box", href: ROUTES.configurator }, { label: "Get a quote", href: ROUTES.quote }, { label: "Contact us", href: ROUTES.contact }];
  return (
    <footer id="contact" className="relative z-10 border-t-4 border-[var(--kraft)] bg-[color-mix(in_srgb,var(--sand)_45%,var(--bg))] px-6 pb-8 pt-14">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-x-12">
        <div className="col-span-2 lg:col-span-1">
          <Logo className="text-2xl" size={30} />
          <p className="mt-4 max-w-xs text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[var(--muted)]">
            {site.social.map((s) => (<li key={s.name}><a href={s.href} className={link}>{s.name}</a></li>))}
          </ul>
        </div>
        <nav aria-label={footer.productsTitle}>
          <h2 className={head}>{footer.productsTitle}</h2>
          <ul className="text-[var(--muted)]">{site.products.items.map((p) => (<li key={p.id}><Link href={HOME_CATEGORY_HREF[p.id]} className={link}>{p.name}</Link></li>))}</ul>
        </nav>
        <nav aria-label={footer.companyTitle}>
          <h2 className={head}>{footer.companyTitle}</h2>
          <ul className="text-[var(--muted)]">{explore.map((l) => (<li key={l.label}><Link href={l.href} className={link}>{l.label}</Link></li>))}</ul>
        </nav>
        <div className="col-span-2 lg:col-span-1">
          <h2 className={head}>{footer.contactTitle}</h2>
          <ul className="space-y-1 text-[var(--muted)]">
            <li><a href={contact.phoneHref} className={link}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref} className={link}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`} className={link}>{contact.email}</a></li>
            <li className="pt-1">{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-[color-mix(in_srgb,var(--kraft)_60%,transparent)] pt-6 text-sm text-[var(--muted)]">
        <p>© {new Date().getFullYear()} {site.brand.name}. {footer.rights}</p>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <li><Link href="/privacy/" className={link}>Privacy policy</Link></li>
          <li><Link href="/terms/" className={link}>Terms</Link></li>
          <li><a href="#main" className={`${link} font-semibold text-[var(--accent)]`}>Back to top <span aria-hidden="true">↑</span></a></li>
        </ul>
      </div>
    </footer>
  );
}
