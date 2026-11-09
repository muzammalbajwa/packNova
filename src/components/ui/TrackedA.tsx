"use client";

import type { AnchorHTMLAttributes } from "react";
import { useAppStore } from "@/lib/store";
import { track, type TrackData } from "@/lib/track";

/**
 * An <a> that fires `track(event, data)` on click and can hand a product/note to the quote
 * form (`prefill`). For links inside server components.
 */
export default function TrackedA({
  event,
  data,
  prefill,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: string;
  data?: TrackData;
  prefill?: { product?: string; note?: string };
}) {
  return (
    <a
      {...rest}
      onClick={() => {
        if (prefill) useAppStore.getState().setQuotePrefill(prefill);
        track(event, data);
      }}
    />
  );
}
