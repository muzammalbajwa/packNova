/**
 * WebGL can drop its context at any time (a weak GPU under memory pressure, a driver reset, the tab sitting in the background).
 * By default the canvas then stays blank for good. This helper lets the page react: show the poster while the context is gone,
 * and draw again when the browser gives it back. Returns a function that removes the listeners.
 */
export function watchContext(canvas: HTMLCanvasElement, h: { onLost?: () => void; onRestored?: () => void }) {
  const lost = (e: Event) => {
    e.preventDefault(); // without this the browser never restores the context
    h.onLost?.();
  };
  const restored = () => h.onRestored?.();
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return () => {
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
  };
}
