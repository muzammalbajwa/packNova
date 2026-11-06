import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/**
 * Lenis smooth scroll wired into GSAP's ticker so ScrollTrigger and the
 * smooth-scroll position never drift apart. Skipped for reduced-motion users.
 * Returns a cleanup function.
 */
export function initScroll(reducedMotion: boolean): () => void {
  gsap.registerPlugin(ScrollTrigger);
  if (reducedMotion) return () => {};

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
  lenis.on("scroll", ScrollTrigger.update);

  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/**
 * Report a 0-1 progress value for the scroll distance of `trigger`.
 * Returns the ScrollTrigger so the caller can kill() it.
 */
export function trackProgress(
  trigger: Element,
  onProgress: (p: number) => void,
  start = "top top",
  end = "bottom top",
) {
  return ScrollTrigger.create({
    trigger,
    start,
    end,
    onUpdate: (self) => onProgress(self.progress),
    onRefresh: (self) => onProgress(self.progress),
  });
}
