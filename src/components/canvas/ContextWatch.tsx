"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { watchContext } from "@/lib/contextLoss";
import { useAppStore } from "@/lib/store";

/**
 * Lives inside a Canvas. A REAL lost WebGL context shows the poster again (`glLost`) and redraws on restore.
 * Its lifecycle matters: when the canvas goes away (navigating off the page) React Three Fiber releases the context on purpose.
 * The listeners are removed first, so that deliberate release is never mistaken for a loss, and the flag is reset on every mount and unmount
 * (the store outlives the canvas: a stale `glLost = true` kept the poster on top of the live scene after returning to the homepage).
 */
export default function ContextWatch({ flag = true }: { flag?: boolean }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (flag) useAppStore.setState({ glLost: false });
    const off = watchContext(gl.domElement, {
      onLost: () => flag && useAppStore.setState({ glLost: true }),
      onRestored: () => {
        if (flag) useAppStore.setState({ glLost: false });
        invalidate();
      },
    });
    return () => {
      off();
      if (flag) useAppStore.setState({ glLost: false });
    };
  }, [gl, invalidate, flag]);
  return null;
}
