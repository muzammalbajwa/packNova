import { Nunito, Outfit } from "next/font/google";

const display = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const fontClass = `${display.variable} ${body.variable}`;
