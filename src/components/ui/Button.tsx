"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/track";

interface Props {
  href: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
  /** Analytics event name fired on click (see lib/track.ts). */
  track?: string;
}

export default function Button({ href, variant = "primary", children, className = "", track: event }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--r-btn)] px-6 py-3 text-sm font-medium transition-colors duration-300";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--fg)]"
      : "border border-[var(--line-strong)] text-[var(--fg)] hover:border-[var(--fg)]";
  return (
    <a href={href} onClick={event ? () => track(event, { href }) : undefined} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}
