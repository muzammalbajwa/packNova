export type IconKind = "corrugated" | "rigid" | "carton" | "pouch" | "poly" | "courier" | "paper";

const P = (points: string, o: number) => (
  <polygon points={points} fill="currentColor" fillOpacity={o} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
);

/** Simple isometric line-art icons, drawn in `currentColor`. */
export default function ProductIcon({ kind }: { kind: IconKind }) {
  return (
    <svg viewBox="0 0 120 120" className="size-full" fill="none" aria-hidden>
      {kind === "corrugated" && (
        <>
          {P("60,22 100,42 60,62 20,42", 0.18)}
          {P("20,42 60,62 60,104 20,84", 0.32)}
          {P("100,42 60,62 60,104 100,84", 0.5)}
          <path d="M40 32 L80 52" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {kind === "rigid" && (
        <>
          {P("20,58 60,76 60,106 20,88", 0.3)}
          {P("100,58 60,76 60,106 100,88", 0.48)}
          {P("60,18 104,38 60,58 16,38", 0.2)}
          {P("16,38 60,58 60,70 16,50", 0.34)}
          {P("104,38 60,58 60,70 104,50", 0.52)}
        </>
      )}
      {kind === "carton" && (
        <>
          {P("34,40 62,28 90,40 62,52", 0.2)}
          {P("34,40 62,52 62,108 34,96", 0.32)}
          {P("62,52 90,40 90,96 62,108", 0.5)}
          <path d="M34 56 L62 68" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "pouch" && (
        <>
          <path d="M36 24h48l8 74q-32 14-64 0z" fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M37 40h46" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5" />
          <path d="M44 62h32M48 74h24" stroke="currentColor" strokeOpacity={0.6} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === "poly" && (
        <>
          <path d="M28 34h64v64H28z" fill="currentColor" fillOpacity={0.22} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M28 44h64M28 90h64" stroke="currentColor" strokeOpacity={0.55} strokeWidth="2" />
          <circle cx="60" cy="39" r="2.5" fill="var(--accent)" />
          <path d="M40 60q10-8 20 0t20 0" stroke="currentColor" strokeOpacity={0.6} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === "courier" && (
        <>
          <path d="M26 30h68v72H26z" fill="currentColor" fillOpacity={0.3} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M26 30l34 24 34-24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity={0.14} />
          <rect x="40" y="62" width="40" height="8" rx="2" fill="var(--accent)" />
        </>
      )}
      {kind === "paper" && (
        <>
          <path d="M42 46C42 20 78 20 78 46" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          {P("30,44 90,44 94,104 26,104", 0.28)}
          <path d="M30 44h60" stroke="currentColor" strokeOpacity={0.6} strokeWidth="2" />
          <path d="M60 44v60" stroke="currentColor" strokeOpacity={0.3} strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
