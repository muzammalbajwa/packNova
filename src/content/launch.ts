/**
 * Staging versus production, decided at BUILD time by one environment variable:
 *   NEXT_PUBLIC_ALLOW_INDEXING=1  -> search engines may index the site (robots.txt allows, pages carry no noindex).
 * Anything else (the default, and the staging workflow) keeps everything noindex and robots.txt on Disallow.
 * The production workflow (.github/workflows/deploy-production.yml) sets it; nothing else should.
 */
export const INDEXABLE = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1";
export const robotsMeta = INDEXABLE ? { index: true, follow: true } : { index: false, follow: false };
