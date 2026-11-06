import type { Metadata } from "next";
import Footer from "@/components/sections/Footer";
import Navbar from "@/components/ui/Navbar";
import { site } from "@/content/site";
import ConfiguratorClient from "./ConfiguratorClient";

export const metadata: Metadata = {
  title: `Configurator | ${site.brand.name}`,
  description: site.configurator.body,
};

export default function ConfiguratorPage() {
  return (
    <>
      <Navbar fromHome={false} />
      <main className="relative z-10 min-h-dvh bg-[var(--bg)]">
        <ConfiguratorClient />
      </main>
      <Footer fromHome={false} />
    </>
  );
}
