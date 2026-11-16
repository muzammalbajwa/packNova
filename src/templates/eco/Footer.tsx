import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import Link from "next/link";
import { GROUPS, HOME_CATEGORY_HREF, ROUTES } from "@/content/catalog";

export default function Footer({ base: _b, onHome: _o }: { base?: string; onHome?: boolean } = {}) {
  void _b; void _o;
  const { footer, contact } = site;
  const link = "hover:text-[var(--fg)] hover:underline underline-offset-4";
  return (
    <footer id="contact" className="relative z-10 border-t border-[var(--line-strong)] bg-[var(--bg)] px-6 pb-12 pt-14">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo className="text-2xl" size={30} />
          <p className="mt-4 max-w-xs text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[var(--muted)]">
            {site.social.map((s) => (<li key={s.name}><a href={s.href} className={link}>{s.name}</a></li>))}
          </ul>
        </div>
        <div>
          <h2 className="font-display mb-3 text-lg font-semibold">{footer.productsTitle}</h2>
          <ul className="space-y-2 text-[var(--muted)]">{site.products.items.map((p) => (<li key={p.id}><Link href={HOME_CATEGORY_HREF[p.id]} className={link}>{p.name}</Link></li>))}</ul>
        </div>
        <div>
          <h2 className="font-display mb-3 text-lg font-semibold">{footer.companyTitle}</h2>
          <ul className="space-y-2 text-[var(--muted)]">{[...GROUPS.map((g) => ({ label: g.label, href: g.href })), { label: "Design your box", href: ROUTES.configurator }, { label: "Get a quote", href: ROUTES.quote }, { label: "Contact us", href: ROUTES.contact }].map((l) => (<li key={l.label}><Link href={l.href} className={link}>{l.label}</Link></li>))}</ul>
        </div>
        <div>
          <h2 className="font-display mb-3 text-lg font-semibold">{footer.contactTitle}</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            <li><a href={contact.phoneHref} className={link}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref} className={link}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`} className={link}>{contact.email}</a></li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">© {new Date().getFullYear()} {site.brand.name}. {footer.rights} <Link href="/privacy/" className="ml-3 underline underline-offset-4 hover:text-[var(--fg)]">Privacy policy</Link> <Link href="/terms/" className="ml-3 underline underline-offset-4 hover:text-[var(--fg)]">Terms</Link></p>
    </footer>
  );
}
