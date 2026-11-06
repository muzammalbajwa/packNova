import type { ReactNode } from "react";

interface Props {
  href: string;
  variant?: "primary" | "ghost";
  children: ReactNode;
  className?: string;
}

export default function Button({ href, variant = "primary", children, className = "" }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors duration-300";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-black hover:bg-[var(--fg)]"
      : "border border-white/20 text-[var(--fg)] hover:border-[var(--fg)]";
  return (
    <a href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </a>
  );
}
