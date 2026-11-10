import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";

export default function Footer({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const { footer, contact } = site;
  return (
    <footer id="contact" className="relative z-10 bg-[var(--bg)] px-5 pb-12 pt-6">
      <div className="mx-auto grid max-w-6xl gap-10 rounded-[2.5rem] bg-[var(--surface)] p-8 md:grid-cols-[1.4fr_1fr_1fr_1.3fr] md:p-12">
        <div>
          <Logo className="text-3xl" size={34} />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            {site.social.map((s) => (<li key={s.name}><a href={s.href} className="block rounded-full bg-[var(--wash)] px-3.5 py-1.5 hover:bg-[var(--accent)] hover:text-[var(--on-accent)]">{s.name}</a></li>))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-lg font-bold">{footer.productsTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">{site.products.items.map((p) => (<li key={p.id}><a href={templateHref(base, { hash: "products" }, onHome)}>{p.name}</a></li>))}</ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-lg font-bold">{footer.companyTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">{site.nav.links.map((l) => (<li key={l.label}><a href={templateHref(base, l, onHome)}>{l.label}</a></li>))}</ul>
        </div>
        <div>
          <h3 className="mb-4 font-display text-lg font-bold">{footer.contactTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li><a href={contact.phoneHref}>{contact.phone}</a></li>
            <li><a href={contact.whatsappHref}>WhatsApp: {contact.whatsapp}</a></li>
            <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl px-4 text-xs text-[var(--muted)]">© {new Date().getFullYear()} {site.brand.name}. {footer.rights}</p>
    </footer>
  );
}
