"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

/** "Back to templates" pill, shown only when the URL has ?preview=1 (the picker adds it). */
export default function PreviewBack() {
  const show = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(location.search).get("preview") === "1",
    () => false,
  );
  if (!show) return null;
  return (
    <Link
      href="/"
      className="fixed bottom-24 left-3 z-[190] rounded-full bg-[#111318] px-4 py-2 text-xs font-medium text-white shadow-lg ring-1 ring-white/30 hover:bg-black xl:bottom-4"
    >
      ← Back to templates
    </Link>
  );
}
