/** Resolve a nav/CTA target: `hash` links stay in-page on the home page, absolute from other pages. */
export function resolveHref(target: { href?: string; hash?: string }, fromHome = true): string {
  if (target.href) return target.href;
  return `${fromHome ? "" : "/"}#${target.hash}`;
}
