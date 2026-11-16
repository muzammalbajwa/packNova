/** Route constants and the quote link builder. Tiny and free of page copy, so the header and the forms can import it without the catalog. */

export const ROUTES = { quote: "/quote/", contact: "/contact/", configurator: "/configurator/" } as const;

/** Quote link that carries the product name to the quote form. */
export const quoteHref = (product?: string, note?: string) => {
  const q = new URLSearchParams();
  if (product) q.set("product", product);
  if (note) q.set("note", note);
  const s = q.toString();
  return s ? `${ROUTES.quote}?${s}` : ROUTES.quote;
};
