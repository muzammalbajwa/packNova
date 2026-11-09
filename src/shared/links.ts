/**
 * Link helpers for templates. A template lives under `/t/<id>`, so in-page targets (`hash`) stay
 * local on its home page and are prefixed from other pages, and the shared `/configurator/` link
 * is mapped to that template's own configurator route.
 */
export interface LinkTarget {
  href?: string;
  hash?: string;
}

export function templateHref(base: string, target: LinkTarget, onHome = true): string {
  if (target.href) return target.href === "/configurator/" ? `${base}/configurator/` : target.href;
  return `${onHome ? "" : `${base}/`}#${target.hash}`;
}
