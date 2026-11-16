import "./tokens.css";
import Reviews from "@/components/sections/Reviews";
import TemplateFrame from "@/shared/TemplateFrame";
import { config } from "./config";
import { fontClass } from "./fonts";
import ConfiguratorTeaser from "./ConfiguratorTeaser";
import Footer from "./Footer";
import { FactoryPhoto, ProductPhotos } from "./Photos";
import Hero from "./Hero";
import Navbar from "./Navbar";
import Process from "./Process";
import Products from "./Products";
import QuoteSection from "./QuoteSection";
import Story from "./Story";

/** Empty: eco is the site root, so links are "/" and "/configurator/". The /t/eco/ route still works. */
export const BASE = "";

export default function Home() {
  return (
    <TemplateFrame id="eco" base={BASE} config={config} fontClass={fontClass} previewBack={false}>
      <Navbar base={BASE} />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero base={BASE} />
        <Products />
        <ProductPhotos />
        <Story base={BASE} />
        <Process />
        <FactoryPhoto />
        <Reviews />
        <ConfiguratorTeaser base={BASE} />
        <QuoteSection />
      </main>
      <Footer base={BASE} />
    </TemplateFrame>
  );
}
