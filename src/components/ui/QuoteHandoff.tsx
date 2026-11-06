import { site } from "@/content/site";
import { mailtoUrl, whatsappUrl } from "@/lib/quoteMessage";

/** Shown after a valid submit: the message is only sent when the user presses send in WhatsApp / their mail app. */
export default function QuoteHandoff({ text, onEdit }: { text: string; onEdit: () => void }) {
  const s = site.quote.success;
  return (
    <div role="status" className="rounded-3xl bg-black p-8 text-[var(--fg)] md:p-10">
      <p className="font-display text-3xl font-bold leading-tight tracking-tight">{s.title}</p>
      <p className="mt-3 text-[var(--muted)]">{s.body}</p>
      <pre className="mt-5 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4 font-sans text-sm text-[var(--muted)]">
        {text}
      </pre>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={whatsappUrl(text)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-[var(--fg)]"
        >
          {s.openAgain}
        </a>
        <a
          href={mailtoUrl(text)}
          className="rounded-full border border-white/20 px-6 py-3 text-sm transition-colors hover:border-[var(--fg)]"
        >
          {s.emailInstead}
        </a>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full px-4 py-3 text-sm text-[var(--muted)] underline underline-offset-4 hover:text-[var(--fg)]"
        >
          {s.again}
        </button>
      </div>
    </div>
  );
}
