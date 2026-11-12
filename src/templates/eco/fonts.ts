import { Newsreader, Source_Sans_3 } from "next/font/google";

// Headings: Newsreader, a text serif with a calm, printed-matter feel (weights 500 and 600 only).
// Body: Source Sans 3, a humanist sans that stays clear at 17 to 18 px.
const display = Newsreader({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const fontClass = `${display.variable} ${body.variable}`;
