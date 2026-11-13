"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { RecipeId } from "@/content/catalog";
import { prefetchFilm } from "@/film/loaders";

type Props = ComponentProps<typeof Link> & { recipe?: RecipeId };

/**
 * A Link that also starts downloading the 3D film (engine and recipe chunk) of the page it opens, on hover, keyboard
 * focus and touch start, so the film is usually loaded by the time the page appears. Does nothing for pages without a film.
 */
export default function PrefetchLink({ recipe, onPointerEnter, onFocus, onTouchStart, ...rest }: Props) {
  const warm = () => recipe && prefetchFilm(recipe);
  return (
    <Link
      {...rest}
      onPointerEnter={(e) => { warm(); onPointerEnter?.(e); }}
      onFocus={(e) => { warm(); onFocus?.(e); }}
      onTouchStart={(e) => { warm(); onTouchStart?.(e); }}
    />
  );
}
