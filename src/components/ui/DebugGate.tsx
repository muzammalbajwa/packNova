"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const Overlay = dynamic(() => import("./DebugOverlay"), { ssr: false });
const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

/** Loads the ?perf=1 / ?debug=1 overlay (and the store and device detection it uses) only when one of those flags is in the URL. */
export default function DebugGate() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return /[?&](perf|debug)=1/.test(search) ? <Overlay /> : null;
}
