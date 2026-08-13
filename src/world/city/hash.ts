/**
 * Deterministic pseudo-randomness, keyed by a string.
 *
 * Every irregular thing in the city — which plan a building has, where its
 * rooftop plant sits, which window is lit — comes from here rather than from
 * `Math.random()`. Two reasons, and the second is the one that matters:
 *
 *  1. A building that reshuffles its roof on every render is not a building.
 *  2. The site is exported statically. Anything that differs between two runs
 *     is a difference the visitor can see when the page reloads, and a
 *     screenshot in a review stops being reproducible.
 *
 * FNV-1a: no dependency, no allocation, and well enough distributed for
 * choosing between three plans and a couple of roof boxes.
 */

export function hash(seed: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    // The FNV prime, by shifts: `value * 16777619` overflows into a float and
    // loses the low bits, which is exactly where the entropy is.
    value +=
      (value << 1) + (value << 4) + (value << 7) + (value << 8) + (value << 24);
  }
  return value >>> 0;
}

/** 0 … 1, exclusive of 1. */
export function hashUnit(seed: string): number {
  return hash(seed) / 0x100000000;
}

/** An integer in `[0, count)`. */
export function hashInt(seed: string, count: number): number {
  return hash(seed) % count;
}

/** A number in `[min, max)`. */
export function hashRange(seed: string, min: number, max: number): number {
  return min + hashUnit(seed) * (max - min);
}
