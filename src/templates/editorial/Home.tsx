import "./tokens.css";
import Reviews from "@/components/sections/Reviews";
import TemplateFrame from "@/shared/TemplateFrame";
import { config } from "./config";
import { fontClass } from "./fonts";
import ConfiguratorTeaser from "./ConfiguratorTeaser";
import Footer from "./Footer";
import Hero from "./Hero";
import Navbar from "./Navbar";
import Process from "./Process";
import Products from "./Products";
import QuoteSection from "./QuoteSection";
import Story from "./Story";
import Ticker from "./Ticker";

export const BASE = "/t/editorial";

export default function Home() {
  return (
    <TemplateFrame id="editorial" base={BASE} config={config} fontClass={fontClass}>
      <Navbar base={BASE} />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Hero base={BASE} />
        <Ticker />
        <Products />
        <Story base={BASE} />
        <Process />
        <Reviews />
        <ConfiguratorTeaser base={BASE} />
        <QuoteSection />
      </main>
      <Footer base={BASE} />
    </TemplateFrame>
  );
}
