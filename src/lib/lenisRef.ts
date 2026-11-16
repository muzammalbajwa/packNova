import type Lenis from "lenis"; // type only: this file does not load the library

/** The smooth-scroll instance, if the page started one. A tiny holder so the header can pause scrolling (open menu) without importing Lenis and GSAP. */
export const lenisRef: { current: Lenis | null } = { current: null };
export const getLenis = () => lenisRef.current;
