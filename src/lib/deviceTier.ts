export type Tier = "none" | "low" | "mid" | "high";

export interface DeviceProfile {
  tier: Tier;
  webgl: boolean;
  mobile: boolean;
  /** Canvas device-pixel-ratio range passed to <Canvas dpr>. */
  dpr: [number, number];
  /** Post-processing is only ever enabled on the high tier. */
  postprocessing: boolean;
  /** Soft shadows / contact shadows. */
  shadows: boolean;
  /** Radial segment budget for rounded details (lower = fewer triangles). */
  detail: 0 | 1 | 2;
}

interface NavigatorExtras {
  deviceMemory?: number;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ||
      c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const PROFILES: Record<Tier, Omit<DeviceProfile, "webgl" | "mobile">> = {
  none: { tier: "none", dpr: [1, 1], postprocessing: false, shadows: false, detail: 0 },
  low: { tier: "low", dpr: [1, 1.25], postprocessing: false, shadows: false, detail: 0 },
  mid: { tier: "mid", dpr: [1, 1.5], postprocessing: false, shadows: true, detail: 1 },
  high: { tier: "high", dpr: [1, 2], postprocessing: true, shadows: true, detail: 2 },
};

/**
 * Classify the device. Runs on the client only.
 * `?tier=low|mid|high|none` in the URL overrides detection (for testing).
 */
export function detectDevice(): DeviceProfile {
  const nav = navigator as Navigator & NavigatorExtras;
  const ua = nav.userAgent;
  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    window.matchMedia("(pointer: coarse)").matches;
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory; // undefined on Safari/Firefox

  const webgl = hasWebGL();
  let tier: Tier;

  if (!webgl) {
    tier = "none";
  } else if (mobile) {
    // iOS hides deviceMemory; modern iPhones are strong enough for "mid".
    if (ios) tier = "mid";
    else if ((memory ?? 3) <= 4 || cores <= 6) tier = "low";
    else tier = "mid";
  } else if (cores <= 4 || (memory ?? 8) <= 2) {
    tier = "low";
  } else if (cores >= 8 && (memory ?? 8) >= 8) {
    tier = "high";
  } else {
    tier = "mid";
  }

  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "low" || forced === "mid" || forced === "high" || forced === "none") {
    tier = forced;
  }

  return { ...PROFILES[tier], webgl: webgl && tier !== "none", mobile };
}
