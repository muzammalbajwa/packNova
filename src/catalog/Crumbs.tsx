import Link from "next/link";

export default function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted)]">
      <ol className="flex flex-wrap items-center gap-x-2">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center gap-x-2">
            {t.href ? <Link href={t.href} className="underline-offset-4 hover:underline">{t.label}</Link> : <span aria-current="page" className="text-[var(--fg)]">{t.label}</span>}
            {i < trail.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
