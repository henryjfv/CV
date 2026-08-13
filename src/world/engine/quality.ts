/**
 * Decides how much world a device gets — and whether it gets one at all.
 *
 * Runs once, before the canvas mounts, from cheap signals only: no benchmark
 * loop, no frame sampling, nothing that costs the user time before the first
 * paint. A device that turns out to be slower than it looked is caught later
 * by the adaptive DPR in the canvas itself.
 */

export type QualityTier = "high" | "mid" | "low" | "none";

export type QualitySettings = {
  tier: QualityTier;
  /** Device pixel ratio ceiling. Capped hard: this is the cheapest win there is. */
  dpr: [number, number];
  /** Particle budget for the whole scene. */
  particles: number;
  /** Anti-aliasing is expensive on integrated GPUs at high DPR. */
  antialias: boolean;
  /** Whether the user asked the operating system for less motion. */
  reducedMotion: boolean;
};

const NONE: QualitySettings = {
  tier: "none",
  dpr: [1, 1],
  particles: 0,
  antialias: false,
  reducedMotion: true,
};

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function detectQuality(): QualitySettings {
  if (typeof window === "undefined") return NONE;
  if (!hasWebGL2()) return NONE;

  const reducedMotion = prefersReducedMotion();

  // `deviceMemory` and `hardwareConcurrency` are advisory and absent on some
  // browsers, so the defaults assume a mid-range machine rather than the worst
  // case — guessing too low would punish Safari users for a missing API.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;

  const isPhone = coarsePointer && narrow;
  const weak = memory <= 4 || cores <= 4;

  if (isPhone || weak) {
    return {
      tier: "low",
      dpr: [1, 1.5],
      particles: 1500,
      antialias: false,
      reducedMotion,
    };
  }

  if (memory <= 8 || cores <= 8) {
    return {
      tier: "mid",
      dpr: [1, 1.5],
      particles: 3500,
      antialias: true,
      reducedMotion,
    };
  }

  return {
    tier: "high",
    dpr: [1, 2],
    particles: 6000,
    antialias: true,
    reducedMotion,
  };
}
