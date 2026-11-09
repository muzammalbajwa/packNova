import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";

export default function Footer({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const { footer, contact } = site;
  return (
    <footer id="contact" className="relative z-10 border-t border-[var(--fg)] bg-[var(--bg)] px-6 pb-12 pt-16">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo className="text-3xl" size={32} />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mt-6 flex gap-5 text-sm">
            {site.social.map((s) => (
              <li key={s.name}><a href={s.href} className="underline underline-offset-4">{s.name}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{footer.productsTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.products.items.map((p) => (
              <li key={p.id}><a href={templateHref(base, { hash: "products" }, onHome)}>{p.name}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{footer.companyTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.nav.links.map((l) => (
              <li key={l.label}><a href={templateHref(base, l, onHome)}>{l.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{footer.contactTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li><a href={contact.phoneHref}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-14 max-w-7xl border-t border-[var(--line-strong)] pt-6 text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {site.brand.name}. {footer.rights}
      </p>
    </footer>
  );
}
