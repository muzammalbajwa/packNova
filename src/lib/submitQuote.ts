/**
 * submitQuote(payload): the one place a quote leaves the page through a form service.
 *
 * - NEXT_PUBLIC_QUOTE_ENDPOINT not set: this does nothing (`enabled` is false) and the pages show only the WhatsApp and email buttons.
 * - Set: POSTs JSON to that URL. Works with Formspree, Web3Forms or a small Cloudflare Worker (see README, "Connecting a form service").
 *   NEXT_PUBLIC_QUOTE_ACCESS_KEY (optional) is added as `access_key`, which Web3Forms needs.
 * - Basic spam protection: a hidden honeypot field (a visitor never fills it) and a time-to-fill check. A filled honeypot gets a
 *   normal-looking success and nothing is sent. A request sent much too quickly is held back with a polite message, so a real
 *   person who is simply fast can press send again.
 * Nothing is stored by the website; the draft lives in the visitor's own browser (see QuoteWizard).
 */

export const QUOTE_ENDPOINT: string = process.env.NEXT_PUBLIC_QUOTE_ENDPOINT ?? "";
const ACCESS_KEY: string = process.env.NEXT_PUBLIC_QUOTE_ACCESS_KEY ?? "";

export interface QuotePayload {
  /** The readable summary (the same text WhatsApp and email get). */
  message: string;
  name: string;
  phone: string;
  email: string;
  /** Anything else useful, as plain fields (product, quantity, ...). */
  fields: Record<string, string>;
  /** Honeypot. Must be empty. */
  _gotcha: string;
}

export type SubmitResult = { ok: true } | { ok: false; reason: "too-fast" | "network" | "server" | "disabled" };

export interface SubmitOptions {
  endpoint?: string;
  /** Milliseconds the visitor has spent on the form. */
  elapsedMs: number;
  /** Minimum plausible time to fill the form. */
  minMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export async function submitQuote(payload: QuotePayload, o: SubmitOptions): Promise<SubmitResult> {
  const endpoint = o.endpoint ?? QUOTE_ENDPOINT;
  if (!endpoint) return { ok: false, reason: "disabled" };
  if (payload._gotcha.trim()) return { ok: true }; // a bot filled the hidden field: look successful, send nothing
  if (o.elapsedMs < (o.minMs ?? 4000)) return { ok: false, reason: "too-fast" };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), o.timeoutMs ?? 15000);
  try {
    const res = await (o.fetchImpl ?? fetch)(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...(ACCESS_KEY ? { access_key: ACCESS_KEY } : {}), ...payload, _elapsed_ms: Math.round(o.elapsedMs) }),
      signal: ctl.signal,
    });
    if (!res.ok) return { ok: false, reason: "server" };
    // some services answer 200 with {"success": false} / {"ok": false}
    const body = await res.json().catch(() => null);
    if (body && (body.success === false || body.ok === false)) return { ok: false, reason: "server" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timer);
  }
}
