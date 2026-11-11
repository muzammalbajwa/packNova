/** Small flat illustrations of each making step. Used by the no-WebGL / reduced-motion list. */
const KRAFT = "var(--kraft)";
const ACC = "var(--accent)";
const INK = "var(--fg)";
const SKY = "var(--wash, rgba(0,0,0,0.08))";

/** Cargo plane, side view, nose to the right. */
function Plane({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M8 40 L24 40 L14 22 L24 22 L40 40 Z" fill={ACC} />
      <path d="M12 38 C12 30 24 28 60 28 L84 28 C98 28 106 34 108 40 C106 46 98 50 84 50 L24 50 C16 50 12 46 12 38 Z" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M46 50 L72 50 L52 66 L40 66 Z" fill={ACC} />
      <rect x="84" y="32" width="12" height="7" rx="2" fill={INK} opacity="0.7" />
    </g>
  );
}

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
      {id === "count" && (
        <>
          <rect x="8" y="80" width="104" height="14" rx="7" fill={INK} opacity="0.85" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={14 + i * 25} y="50" width="20" height="30" rx="2" fill={KRAFT} />
              <rect x={14 + i * 25} y="50" width="20" height="11" rx="2" fill={ACC} />
            </g>
          ))}
          <circle cx="22" cy="87" r="2.5" fill="#fff" opacity="0.7" />
          <circle cx="60" cy="87" r="2.5" fill="#fff" opacity="0.7" />
          <circle cx="98" cy="87" r="2.5" fill="#fff" opacity="0.7" />
        </>
      )}
      {id === "pack" && (
        <>
          <polygon points="22,56 98,56 98,104 22,104" fill="var(--kraft-ink)" />
          <polygon points="22,56 8,40 36,40 36,56" fill={KRAFT} />
          <polygon points="98,56 112,40 84,40 84,56" fill={KRAFT} />
          {[0, 1].map((i) => (
            <rect key={i} x={30 + i * 32} y="38" width="26" height="30" rx="2" fill={KRAFT} stroke="var(--kraft-ink)" strokeWidth="1.5" />
          ))}
          <rect x="30" y="38" width="26" height="9" rx="2" fill={ACC} />
          <rect x="62" y="38" width="26" height="9" rx="2" fill={ACC} />
          <rect x="62" y="72" width="30" height="22" fill="#fff" />
          <path d="M65 76v14M69 76v14M72 76v14M77 76v14M81 76v14M85 76v14M89 76v14" stroke={INK} strokeWidth="1.6" />
        </>
      )}
      {id === "load" && (
        <>
          <Plane x={20} y={14} s={0.85} />
          <polygon points="6,100 30,100 30,86 6,100" fill={INK} opacity="0.7" />
          <path d="M6 100 L30 88" stroke={INK} strokeWidth="3" />
          <rect x="14" y="72" width="16" height="14" rx="1.5" fill={KRAFT} stroke="var(--kraft-ink)" strokeWidth="1.5" />
          <rect x="4" y="100" width="112" height="4" rx="2" fill={INK} opacity="0.25" />
        </>
      )}
      {id === "fly" && (
        <>
          <ellipse cx="30" cy="34" rx="20" ry="9" fill={SKY} />
          <ellipse cx="92" cy="96" rx="22" ry="9" fill={SKY} />
          <path d="M10 104 C34 96 46 80 66 70" fill="none" stroke={ACC} strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />
          <circle cx="10" cy="104" r="3.5" fill={INK} />
          <g transform="rotate(-14 60 56)">
            <Plane x={26} y={30} s={0.85} />
          </g>
        </>
      )}
      {id === "deliver" && (
        <>
          <polygon points="14,60 60,28 106,60" fill="var(--kraft-ink)" />
          <rect x="22" y="58" width="76" height="42" fill={KRAFT} />
          <rect x="52" y="68" width="18" height="32" rx="1.5" fill={ACC} />
          <rect x="30" y="68" width="14" height="14" fill="#fff" opacity="0.85" />
          <rect x="78" y="68" width="14" height="14" fill="#fff" opacity="0.85" />
          <rect x="44" y="86" width="14" height="14" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <rect x="44" y="86" width="14" height="5" fill={ACC} />
          <rect x="6" y="100" width="108" height="4" rx="2" fill={INK} opacity="0.25" />
          <path d="M100 18c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9z" fill={ACC} />
          <circle cx="100" cy="27" r="3.5" fill="#fff" />
        </>
      )}
    </svg>
  );
}
