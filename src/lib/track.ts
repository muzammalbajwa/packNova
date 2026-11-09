/**
 * Tiny, vendor-free analytics hook. Call `track("event", { ... })` from CTA clicks.
 * It logs to the console in development and does nothing in production until you plug a
 * vendor into `sinks` (e.g. `sinks.push((name, data) => plausible(name, { props: data }))`).
 */
export type TrackData = Record<string, string | number | boolean | undefined>;
type Sink = (event: string, data?: TrackData) => void;

export const sinks: Sink[] = [];

export function track(event: string, data?: TrackData): void {
  if (process.env.NODE_ENV !== "production") console.log("[track]", event, data ?? "");
  for (const sink of sinks) {
    try {
      sink(event, data);
    } catch {}
  }
}
