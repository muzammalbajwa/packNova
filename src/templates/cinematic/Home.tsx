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

export const BASE = "/t/cinematic";

export default function Home() {
  return (
    <TemplateFrame id="cinematic" base={BASE} config={config} fontClass={fontClass}>
      <Navbar base={BASE} />
      <main className="relative z-10">
        <Hero base={BASE} />
        <Story base={BASE} />
        <Products />
        <Process />
        <Reviews />
        <ConfiguratorTeaser base={BASE} />
        <QuoteSection />
      </main>
      <Footer base={BASE} />
    </TemplateFrame>
  );
}
