import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";

export default function Footer({ base, onHome = true }: { base: string; onHome?: boolean }) {
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
          <h3 className="font-display mb-3 text-lg font-semibold">{footer.productsTitle}</h3>
          <ul className="space-y-2 text-[var(--muted)]">{site.products.items.map((p) => (<li key={p.id}><a href={templateHref(base, { hash: "products" }, onHome)} className={link}>{p.name}</a></li>))}</ul>
        </div>
        <div>
          <h3 className="font-display mb-3 text-lg font-semibold">{footer.companyTitle}</h3>
          <ul className="space-y-2 text-[var(--muted)]">{site.nav.links.map((l) => (<li key={l.label}><a href={templateHref(base, l, onHome)} className={link}>{l.label}</a></li>))}</ul>
        </div>
        <div>
          <h3 className="font-display mb-3 text-lg font-semibold">{footer.contactTitle}</h3>
          <ul className="space-y-2 text-[var(--muted)]">
            <li><a href={contact.phoneHref} className={link}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref} className={link}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`} className={link}>{contact.email}</a></li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">© {new Date().getFullYear()} {site.brand.name}. {footer.rights}</p>
    </footer>
  );
}
