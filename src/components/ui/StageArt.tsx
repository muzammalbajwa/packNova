/** Small flat illustrations of each making step. Used by the no-WebGL / reduced-motion list. */
const KRAFT = "var(--kraft)";
const ACC = "var(--accent)";
const INK = "var(--fg)";

function Sheet({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <rect x="14" y="22" width="92" height="76" rx="4" fill={KRAFT} />
      {children}
    </>
  );
}

export default function StageArt({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {id === "board" && <Sheet />}
      {id === "print" && (
        <Sheet>
          <rect x="14" y="22" width="56" height="76" rx="4" fill={ACC} />
          <rect x="68" y="18" width="3" height="84" fill={INK} opacity="0.7" />
        </Sheet>
      )}
      {id === "finish" && (
        <Sheet>
          <rect x="14" y="22" width="92" height="76" rx="4" fill={ACC} />
          <polygon points="52,22 70,22 46,98 28,98" fill="#fff" opacity="0.38" />
          <circle cx="84" cy="40" r="7" fill="var(--kraft-ink)" />
        </Sheet>
      )}
      {id === "diecut" && (
        <Sheet>
          <path d="M38 22v22H14v32h24v22h28V76h40V44H66V22z" fill={ACC} opacity="0.9" />
          <path d="M38 22v22H14v32h24v22h28V76h40V44H66V22z" fill="none" stroke="#E8334F" strokeWidth="2.5" />
          <path d="M38 44v32M66 44v32" stroke="#2F7BFF" strokeWidth="2" strokeDasharray="4 3" />
        </Sheet>
      )}
      {id === "fold" && (
        <>
          <polygon points="40,34 80,34 80,96 40,96" fill={ACC} />
          <polygon points="40,34 22,44 22,106 40,96" fill={KRAFT} />
          <polygon points="80,34 98,44 98,106 80,96" fill={KRAFT} opacity="0.8" />
          <polygon points="40,34 80,34 90,24 50,24" fill={KRAFT} opacity="0.7" />
        </>
      )}
      {id === "glue" && (
        <>
          <polygon points="26,38 60,52 60,100 26,86" fill={KRAFT} />
          <polygon points="94,38 60,52 60,100 94,86" fill={KRAFT} opacity="0.8" />
          <polygon points="60,24 94,38 60,52 26,38" fill={ACC} />
          <rect x="86" y="44" width="8" height="42" fill={ACC} />
        </>
      )}
      {id === "ship" && (
        <>
          <polygon points="26,42 60,56 60,102 26,88" fill={KRAFT} />
          <polygon points="94,42 60,56 60,102 94,88" fill="var(--kraft-ink)" />
          <polygon points="60,28 94,42 60,56 26,42" fill={ACC} />
        </>
      )}
    </svg>
  );
}
