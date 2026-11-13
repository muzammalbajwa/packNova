import type { CatalogPage, Skin } from "@/content/catalog";
import { site } from "@/content/site";

type P = [number, number];
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};
const pts = (a: P[]) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
/** Point inside a quad (corners p0 p1 p2 p3, bottom-left, bottom-right, top-right, top-left) at (u, v). */
const q = (f: P[], u: number, v: number): P => {
  const bx = f[0][0] + (f[1][0] - f[0][0]) * u, by = f[0][1] + (f[1][1] - f[0][1]) * u;
  const tx = f[3][0] + (f[2][0] - f[3][0]) * u, ty = f[3][1] + (f[2][1] - f[3][1]) * u;
  return [bx + (tx - bx) * v, by + (ty - by) * v];
};
const sub = (f: P[], u0: number, v0: number, u1: number, v1: number) => [q(f, u0, v0), q(f, u1, v0), q(f, u1, v1), q(f, u0, v1)];

function Box({ skin }: { skin: Skin }) {
  const [rl, rd, rh] = skin.ratio;
  const c = 0.866;
  const s = Math.min(270 / ((rl + rd) * c), 190 / ((rl + rd) * 0.5 + rh));
  const L = rl * s, D = rd * s, H = rh * s;
  const O: P = [200 + ((D - L) * c) / 2, 262 - ((L + D) * 0.5) / 2 * 1 - 4];
  const P3 = (x: number, y: number, z: number): P => [O[0] + (x - z) * c, O[1] + (x + z) * 0.5 - y];
  const top = [P3(0, H, D), P3(L, H, D), P3(L, H, 0), P3(0, H, 0)];
  const front = [P3(0, 0, D), P3(L, 0, D), P3(L, H, D), P3(0, H, D)];
  const right = [P3(L, 0, D), P3(L, 0, 0), P3(L, H, 0), P3(L, H, D)];
  const full = skin.print === "full";
  const base = full ? skin.second : skin.base;
  const ink = skin.accent;
  const foil = skin.foil ? skin.second : ink;
  const lid = skin.lid === "lid-base" || skin.lid === "magnet" || skin.lid === "shoulder";
  const parts: React.ReactNode[] = [];
  const faces: [P[], number][] = [[front, 1], [right, 0.78]];
  faces.forEach(([f, k], i) => {
    if (skin.print === "band" || full) {
      parts.push(<polygon key={`b${i}`} points={pts(sub(f, 0, 0.3, 1, 0.42))} fill={shade(full ? skin.base : ink, k)} />);
    } else if (skin.print === "stripes") {
      for (let n = 0; n < 9; n++) parts.push(<polygon key={`s${i}${n}`} points={pts(sub(f, n / 9 + 0.03, 0, n / 9 + 0.07, 1))} fill={shade(ink, k)} />);
    } else if (skin.print === "dots") {
      for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) { const [x, y] = q(f, 0.1 + a * 0.2, 0.15 + b * 0.22); parts.push(<ellipse key={`d${i}${a}${b}`} cx={x} cy={y} rx={2.6} ry={2.6} fill={shade(ink, k)} />); }
    }
  });
  const win = skin.window ? sub(front, 0.16, 0.28, 0.84, 0.7) : null;
  const mid = P3(L * 0.5, H * 0.62, D);
  return (
    <g>
      <polygon points={pts(front)} fill={shade(base, 1)} />
      <polygon points={pts(right)} fill={shade(base, 0.78)} />
      <polygon points={pts(top)} fill={shade(base, 1.12)} />
      {parts}
      {win && <polygon points={pts(win)} fill="#e8eef0" fillOpacity={0.55} stroke={shade(base, 0.7)} strokeWidth={1.2} />}
      {lid && <polygon points={pts([...sub(front, 0, 0.84, 1, 0.86), ...[]])} fill={shade(base, 0.6)} />}
      {lid && <polygon points={pts(sub(right, 0, 0.84, 1, 0.86))} fill={shade(base, 0.5)} />}
      {skin.props.includes("ribbon") && <polygon points={pts(sub(front, 0.46, 0, 0.54, 1))} fill={shade(skin.second, 1)} />}
      {skin.props.includes("ribbon") && <polygon points={pts(sub(right, 0.46, 0, 0.54, 1))} fill={shade(skin.second, 0.8)} />}
      {skin.props.includes("ribbon") && <polygon points={pts(sub(top, 0.46, 0, 0.54, 1))} fill={shade(skin.second, 1.1)} />}
      {skin.print !== "none" && !skin.props.includes("ribbon") && (
        <text x={0} y={0} transform={`translate(${mid[0]},${mid[1] - H * 0.12}) skewY(30)`} textAnchor="middle" fill={skin.print === "stripes" || skin.print === "dots" ? shade(base, 1) : full ? skin.base : foil} fontFamily="Georgia, serif" fontWeight={600} fontSize={Math.min(L * 0.17, 22)} stroke={skin.print === "stripes" || skin.print === "dots" ? shade(ink, 1) : "none"} strokeWidth={skin.print === "stripes" ? 0 : 0}>
          {site.brand.name}
        </text>
      )}
      {skin.handle && <path d={`M${top[0][0] + (top[1][0] - top[0][0]) * 0.3},${top[0][1] - 4} q${(top[1][0] - top[0][0]) * 0.2},-36 ${(top[1][0] - top[0][0]) * 0.4},0`} fill="none" stroke={shade(base, 0.65)} strokeWidth={5} strokeLinecap="round" />}
    </g>
  );
}

function Pouch({ skin }: { skin: Skin }) {
  return (
    <g>
      <path d="M130 70 h140 l10 20 v150 q0 22 -22 22 h-116 q-22 0 -22 -22 v-150 z" fill={shade(skin.base, 1)} />
      <rect x={120} y={64} width={160} height={14} rx={3} fill={shade(skin.base, 0.7)} />
      <rect x={130} y={92} width={140} height={4} fill={shade(skin.base, 0.55)} />
      <rect x={120} y={146} width={160} height={42} fill={skin.accent} />
      <text x={200} y={174} textAnchor="middle" fill={skin.base} fontFamily="Georgia, serif" fontWeight={600} fontSize={22}>{site.brand.name}</text>
    </g>
  );
}
function Bag({ skin }: { skin: Skin }) {
  return (
    <g>
      <path d="M150 90 q0 -50 50 -50 q50 0 50 50" fill="none" stroke={shade(skin.base, 0.65)} strokeWidth={6} />
      <polygon points="120,90 280,90 292,262 108,262" fill={shade(skin.base, 1)} />
      <polygon points="120,90 160,90 148,262 108,262" fill={shade(skin.base, 0.85)} />
      <text x={200} y={178} textAnchor="middle" fill={skin.accent} fontFamily="Georgia, serif" fontWeight={600} fontSize={24}>{site.brand.name}</text>
    </g>
  );
}
function Tag({ skin, label }: { skin: Skin; label: boolean }) {
  return label ? (
    <g>
      <rect x={110} y={100} width={180} height={120} rx={14} fill={shade(skin.base, 1)} stroke={shade(skin.base, 0.7)} />
      <text x={200} y={170} textAnchor="middle" fill={skin.accent} fontFamily="Georgia, serif" fontWeight={600} fontSize={26}>{site.brand.name}</text>
    </g>
  ) : (
    <g>
      <path d="M200 40 C 170 70 230 90 200 120" fill="none" stroke={shade(skin.base, 0.6)} strokeWidth={3} />
      <path d="M150 112 h100 a14 14 0 0 1 14 14 v110 a14 14 0 0 1 -14 14 h-100 a14 14 0 0 1 -14 -14 v-110 a14 14 0 0 1 14 -14 z" fill={shade(skin.base, 1)} stroke={shade(skin.base, 0.7)} />
      <circle cx={200} cy={134} r={7} fill="#e9e3d6" stroke={shade(skin.base, 0.6)} />
      <text x={200} y={208} textAnchor="middle" fill={skin.accent} fontFamily="Georgia, serif" fontWeight={600} fontSize={22}>{site.brand.name}</text>
    </g>
  );
}

/** A lightweight illustration of the product in its skin colors. Shown instantly; the live 3D film fades in over it. */
export default function ProductPoster({ page, className = "" }: { page: CatalogPage; className?: string }) {
  const { recipe, skin } = page;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={`${page.title}: illustration`} className={className}>
      <ellipse cx={200} cy={268} rx={120} ry={13} fill="#2a1d0c" opacity={0.16} />
      {recipe === "pouch" ? <Pouch skin={skin} /> : recipe === "paper-bag" ? <Bag skin={skin} /> : recipe === "label-tag" ? <Tag skin={skin} label={page.slug.startsWith("labels")} /> : <Box skin={skin} />}
    </svg>
  );
}
