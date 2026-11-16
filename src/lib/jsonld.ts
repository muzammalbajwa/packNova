import { contactPage } from "../content/contactPage";
import { site } from "../content/site";

/**
 * LocalBusiness structured data, built from site.ts. Every value is a DUMMY until the owner replaces it in site.ts
 * (see CONTENT-TODO.md, "Structured data"). The pages stay noindex while this is staging.
 */
export function localBusinessJsonLd() {
  const c = site.contact;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.brand.name,
    description: site.brand.description,
    url: site.brand.url,
    telephone: c.phone,
    email: c.email,
    address: { "@type": "PostalAddress", streetAddress: c.address },
    geo: { "@type": "GeoCoordinates", latitude: contactPage.geo.lat, longitude: contactPage.geo.lng },
    openingHours: c.hours,
    sameAs: site.social.filter((s) => s.href.startsWith("http")).map((s) => s.href),
  };
}
