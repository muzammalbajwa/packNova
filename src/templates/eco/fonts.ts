import localFont from "next/font/local";

// Self-hosted and trimmed (scripts/make-fonts.py): Latin only, only the weights the site uses.
//   Headings: Newsreader, weights 500 to 600 (34 kB). Body: Source Sans 3, weights 400 to 700 (22 kB).
// next/font adds a fallback font with adjusted size and metrics, so the text does not jump when the font arrives (no layout shift).
// To change a font, rebuild the file with scripts/make-fonts.py. Urdu text later: add an Urdu font here and in --font-display / --font-body.
const display = localFont({
  src: [{ path: "./fonts/newsreader-500-600.woff2", weight: "500 600", style: "normal" }],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const body = localFont({
  src: [{ path: "./fonts/sourcesans3-400-700.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const fontClass = `${display.variable} ${body.variable}`;
