"use client";

import { useEffect, type ElementType, type ReactNode } from "react";
import { useInView } from "react-intersection-observer";
import { useAppStore } from "@/lib/store";

interface Props {
  as?: ElementType;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Marks a page region that needs the fixed 3D canvas. The canvas only renders
 * while at least one SceneZone is near the viewport (see Scene.tsx).
 */
export default function SceneZone({ as: Tag = "section", id, className, children }: Props) {
  const { ref, inView } = useInView({ rootMargin: "200px 0px" });

  useEffect(() => {
    if (!inView) return;
    const { zoneChange } = useAppStore.getState();
    zoneChange(1);
    return () => zoneChange(-1);
  }, [inView]);

  return (
    <Tag ref={ref} id={id} data-scene className={className}>
      {children}
    </Tag>
  );
}
