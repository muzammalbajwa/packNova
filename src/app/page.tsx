import { TEMPLATE_META } from "@/templates/registry";

export default function TemplatePicker() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold">Choose a template</h1>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {TEMPLATE_META.map((t) => (
          <li key={t.id} className="rounded-xl border border-[var(--line-strong)] p-6">
            <h2 className="text-xl font-semibold">{t.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{t.blurb}</p>
            <a href={`/t/${t.id}/?preview=1`} className="mt-4 inline-block underline">Open</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
