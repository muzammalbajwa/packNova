import { site } from "@/content/site";
import Logo from "@/components/ui/Logo";
import { templateHref } from "@/shared/links";

export default function Footer({ base, onHome = true }: { base: string; onHome?: boolean }) {
  const { footer, contact } = site;
  return (
    <footer id="contact" className="relative z-10 bg-[var(--bg)] px-6 pb-12 pt-20">
      <div className="mx-auto max-w-6xl text-center">
        <Logo className="justify-center text-5xl" size={48} />
        <p className="mx-auto mt-5 max-w-md text-[var(--muted)]">{footer.blurb}</p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
          {site.nav.links.map((l) => (
            <li key={l.label}><a href={templateHref(base, l, onHome)} className="text-[var(--muted)] hover:text-[var(--fg)]">{l.label}</a></li>
          ))}
        </ul>
        <div className="glass mx-auto mt-10 grid max-w-3xl gap-4 rounded-[var(--r-card)] p-6 text-sm text-[var(--muted)] sm:grid-cols-2">
          <p><a href={contact.phoneHref}>{contact.phone}</a><br /><a href={contact.whatsappHref}>WhatsApp: {contact.whatsapp}</a></p>
          <p><a href={`mailto:${contact.email}`}>{contact.email}</a><br />{contact.hours}</p>
          <p className="sm:col-span-2">{contact.address}</p>
        </div>
        <ul className="mt-8 flex justify-center gap-6 text-sm">
          {site.social.map((s) => (<li key={s.name}><a href={s.href} className="text-[var(--muted)] hover:text-[var(--fg)]">{s.name}</a></li>))}
        </ul>
        <p className="mt-10 text-xs text-[var(--muted)]">© {new Date().getFullYear()} {site.brand.name}. {footer.rights}</p>
      </div>
    </footer>
  );
}
