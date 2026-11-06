import { site } from "@/content/site";

/** Small folded-box mark: kraft body, accent lid folding open. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <polygon points="4,12 16,18 16,29 4,23" fill="#c9a574" />
      <polygon points="28,12 16,18 16,29 28,23" fill="#8d6a3a" />
      <polygon points="16,5 28,11 16,17 4,11" fill="#ff5b2e" />
      <polygon points="4,11 16,17 16,13 7,8.5" fill="#000" opacity="0.18" />
      <path d="M16 17v12" stroke="#0b0a09" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

/** Mark + wordmark. The second capital letter of the name takes the accent color. */
export default function Logo({ className = "", size = 28 }: { className?: string; size?: number }) {
  const name = site.brand.name;
  const split = name.slice(1).search(/[A-Z]/) + 1;
  const head = split > 0 ? name.slice(0, split) : name;
  const tail = split > 0 ? name.slice(split) : "";
  return (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight ${className}`}>
      <LogoMark size={size} />
      <span>
        {head}
        <span className="text-[var(--accent)]">{tail}</span>
      </span>
    </span>
  );
}
