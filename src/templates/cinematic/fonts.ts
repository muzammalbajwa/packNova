import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap", axes: ["wdth"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-ci-sans", display: "swap" });

export const fontClass = `${display.variable} ${body.variable}`;
