import "./tokens.css";
import ConfiguratorClient from "@/app/configurator/ConfiguratorClient";
import TemplateFrame from "@/shared/TemplateFrame";
import { config } from "./config";
import { fontClass } from "./fonts";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { BASE } from "./Home";

export default function ConfiguratorPage() {
  return (
    <TemplateFrame id="industrial" base={BASE} config={config} fontClass={fontClass} scene={false}>
      <Navbar base={BASE} onHome={false} />
      <main id="main" tabIndex={-1} className="relative z-10 min-h-dvh bg-[var(--bg)] outline-none">
        <ConfiguratorClient base={BASE} />
      </main>
      <Footer base={BASE} onHome={false} />
    </TemplateFrame>
  );
}
