import { contactPage } from "@/content/contactPage";
import { site } from "@/content/site";

/** A static, stylised map (inline SVG, no tiles, no iframe, no script) with a link that opens the address in Google Maps. */
export default function MapPlaceholder() {
  return (
    <figure className="overflow-hidden rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)]">
      <svg viewBox="0 0 600 340" role="img" aria-label={`Map placeholder for ${site.contact.address}`} className="block h-auto w-full">
        <rect width="600" height="340" fill="#ece5d3" />
        <g fill="none" stroke="#d6cdb5" strokeWidth="14" strokeLinecap="round">
          <path d="M-10 90 L250 120 L610 60" /><path d="M-10 250 L180 220 L420 270 L610 230" /><path d="M120 -10 L170 350" /><path d="M400 -10 L360 350" />
        </g>
        <g fill="none" stroke="#f6f1e4" strokeWidth="8" strokeLinecap="round"><path d="M-10 90 L250 120 L610 60" /><path d="M-10 250 L180 220 L420 270 L610 230" /><path d="M120 -10 L170 350" /><path d="M400 -10 L360 350" /></g>
        <rect x="430" y="140" width="110" height="70" rx="6" fill="#cdd9c9" /><rect x="40" y="130" width="70" height="60" rx="6" fill="#cdd9c9" />
        <g transform="translate(262 128)">
          <path d="M18 0C8 0 0 8 0 18c0 14 18 34 18 34s18-20 18-34C36 8 28 0 18 0z" fill="#1e4d3a" /><circle cx="18" cy="18" r="7" fill="#f1ebde" />
        </g>
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-sm text-[var(--muted)]">{contactPage.mapNote}</span>
        <a href={contactPage.mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-[var(--r-btn)] border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold hover:border-[var(--fg)]">Open in Google Maps</a>
      </figcaption>
    </figure>
  );
}
