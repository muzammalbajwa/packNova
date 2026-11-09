import { site } from "@/content/site";
import { defaultSpec, specLines, specToQuery } from "./configurator";
import { emptyArt } from "./artwork";
import { buildQuoteText, whatsappUrl } from "./quoteMessage";

/** The carton shown in the making-of story is the configurator's default folding carton (12 x 6 x 18 cm). */
const spec = defaultSpec("folding");

/** Type, size and material of the story box, without the configurator's placeholder quantity/artwork lines. */
export const storySpecLines = () =>
  specLines(spec, emptyArt()).filter((l) => !l.startsWith("Quantity") && !l.startsWith("Artwork"));

/** `base` is the template route (e.g. "/t/editorial"), so the configurator keeps the template look. */
export const storyConfiguratorHref = (base = "") => `${base}/configurator/?${specToQuery(spec)}`;

export const storyWhatsappHref = () =>
  whatsappUrl(buildQuoteText({ product: site.making.quoteProduct, spec: storySpecLines().join("\n") }));
