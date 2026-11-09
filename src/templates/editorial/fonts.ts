import { Fraunces, Instrument_Sans } from "next/font/google";

const display = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-ed-sans", display: "swap" });

export const fontClass = `${display.variable} ${body.variable}`;
