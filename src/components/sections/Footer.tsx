import { site } from "@/content/site";
import { resolveHref } from "@/lib/links";
import Logo from "../ui/Logo";

export default function Footer({ fromHome = true }: { fromHome?: boolean }) {
  const { footer, contact } = site;
  return (
    <footer id="contact" className="relative z-10 border-t border-[var(--line)] bg-[var(--bg)] px-6 pb-10 pt-20">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Logo className="text-3xl" size={34} />
          <p className="mt-4 max-w-xs text-sm text-[var(--muted)]">{footer.blurb}</p>
          <ul className="mt-6 flex gap-4 text-sm">
            {site.social.map((s) => (
              <li key={s.name}>
                <a href={s.href} className="text-[var(--muted)] transition-colors hover:text-[var(--fg)]">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">{footer.productsTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.products.items.map((p) => (
              <li key={p.id}>
                <a href={fromHome ? "#products" : "/#products"} className="transition-colors hover:text-[var(--fg)]">
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">{footer.companyTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            {site.nav.links.map((l) => (
              <li key={l.label}>
                <a href={resolveHref(l, fromHome)} className="transition-colors hover:text-[var(--fg)]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">{footer.contactTitle}</h3>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>
              <a href={contact.phoneHref} className="transition-colors hover:text-[var(--fg)]">
                {contact.phone}
              </a>
            </li>
            <li>
              <a href={contact.whatsappHref} className="transition-colors hover:text-[var(--fg)]">
                WhatsApp: {contact.whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-[var(--fg)]">
                {contact.email}
              </a>
            </li>
            <li>{contact.address}</li>
            <li>{contact.hours}</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-16 max-w-6xl border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {site.brand.name}. {footer.rights}
      </p>
    </footer>
  );
}
