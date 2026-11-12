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

/**
 * Fade/slide-in elements marked with `data-reveal` as they enter the viewport.
 * Only elements below the fold are hidden up front, so nothing flashes and
 * content stays visible if JS fails. Skipped for reduced-motion users.
 */
export function initReveal(reducedMotion: boolean): () => void {
  if (reducedMotion) return () => {};
  const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
  // data-reveal="subtle": one short fade and a small lift, no stagger (the eco template)
  const subtle = below.filter((el) => el.dataset.reveal === "subtle");
  const normal = below.filter((el) => el.dataset.reveal !== "subtle");
  gsap.set(normal, { opacity: 0, y: 36 });
  gsap.set(subtle, { opacity: 0, y: 8 });

  const triggers = [
    ...ScrollTrigger.batch(normal, {
      start: "top 90%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, overwrite: true }),
    }),
    ...ScrollTrigger.batch(subtle, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.35, ease: "power1.out", overwrite: true }),
    }),
  ];
  return () => {
    triggers.forEach((t) => t.kill());
    gsap.set(items, { clearProps: "opacity,transform" });
  };
}
