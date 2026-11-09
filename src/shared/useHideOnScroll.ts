import { useEffect, useRef } from "react";

/** Hide a fixed bar on scroll down, show on scroll up. Mutates style directly (no React state). */
export function useHideOnScroll<T extends HTMLElement>(hiddenTransform = "translateY(-140%)") {
  const ref = useRef<T>(null);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (ref.current) ref.current.style.transform = y > last && y > 160 ? hiddenTransform : "translateY(0)";
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hiddenTransform]);
  return ref;
}
