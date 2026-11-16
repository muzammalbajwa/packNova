import "@/templates/eco/tokens.css";
import type { ReactNode } from "react";
import PageFrame from "./PageFrame";
import { fontClass } from "@/templates/eco/fonts";
import Footer from "@/templates/eco/Footer";
import Navbar from "@/templates/eco/Navbar";

/** Eco header and footer around a page that has no hero canvas (the product film mounts its own canvas). */
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <PageFrame id="eco" fontClass={fontClass}>
      <Navbar />
      <main className="relative z-10 bg-[var(--bg)] pt-[6.25rem]">{children}</main>
      <Footer />
    </PageFrame>
  );
}
