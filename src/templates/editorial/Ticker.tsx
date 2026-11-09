import { site } from "@/content/site";

/** A single quiet line of the product/process tags, between rules. */
export default function Ticker() {
  return (
    <div className="relative z-10 border-y border-[var(--fg)] bg-[var(--bg)]">
      <p className="mx-auto max-w-7xl overflow-hidden whitespace-nowrap px-6 py-3 text-center font-display text-sm italic text-[var(--muted)]">
        {site.marquee.join("  /  ")}
      </p>
    </div>
  );
}
