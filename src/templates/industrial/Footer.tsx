import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";

export default function Footer({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const { footer, contact } = site;
  return (
    <footer id="contact" className="relative z-10 bg-[var(--bg)] px-5 pb-10 pt-0 md:px-10">
      <div className="grid border-x border-b border-[var(--fg)] md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="border-b border-[var(--fg)] p-6 md:border-b-0 md:border-r">
          <Logo className="text-2xl" size={28} />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mono mt-5 flex gap-4 text-xs uppercase">
            {site.social.map((s) => (<li key={s.name}><a href={s.href} className="underline underline-offset-4">{s.name}</a></li>))}
          </ul>
        </div>
        <div className="border-b border-[var(--fg)] p-6 md:border-b-0 md:border-r">
          <h3 className="eyebrow mb-4 uppercase">{footer.productsTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.products.items.map((p) => (<li key={p.id}><a href={templateHref(base, { hash: "products" }, onHome)}>{p.name}</a></li>))}
          </ul>
        </div>
        <div className="border-b border-[var(--fg)] p-6 md:border-b-0 md:border-r">
          <h3 className="eyebrow mb-4 uppercase">{footer.companyTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.nav.links.map((l) => (<li key={l.label}><a href={templateHref(base, l, onHome)}>{l.label}</a></li>))}
          </ul>
        </div>
        <div className="p-6">
          <h3 className="eyebrow mb-4 uppercase">{footer.contactTitle}</h3>
          <ul className="mono space-y-2 text-xs text-[var(--muted)]">
            <li><a href={contact.phoneHref}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mono mt-4 text-[11px] uppercase text-[var(--muted)]">© {new Date().getFullYear()} {site.brand.name}. {footer.rights}</p>
    </footer>
  );
}
