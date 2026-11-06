import Experience from "@/components/Experience";
import Configurator from "@/components/sections/Configurator";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import Products from "@/components/sections/Products";
import Process from "@/components/sections/Process";
import Story from "@/components/sections/Story";
import Quote from "@/components/sections/Quote";
import Marquee from "@/components/ui/Marquee";
import Navbar from "@/components/ui/Navbar";

export default function Home() {
  return (
    <>
      <Experience />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Marquee />
        <Products />
        <Story />
        <Process />
        <Configurator />
        <Quote />
      </main>
      <Footer />
    </>
  );
}
