import { STATION_HALF, type Station } from "@/data/world";

/**
 * The dimensions of a station, in one place.
 *
 * The camera rail, the layout and the geometry all need these numbers, and
 * every time they were written twice something ended up in the wrong place —
 * a rail that finished inside a wall, and a final shot framed on top of the
 * station before it.
 */

/** Vertical distance between architectural tiers. */
export const LAYER_HEIGHT = 3.6;

/** Edge length of a technology node. */
export const NODE_SIZE = 1.5;

/** How far a tier's nodes spread from the centre, as a share of the half-width. */
export const NODE_SPREAD = 1.15;

export function stationHalf(station: Station): number {
  return STATION_HALF[station.complexity];
}

/** Total height of the drawn system, from platform to the top tier. */
export function stationHeight(station: Station): number {
  return station.layers.length * LAYER_HEIGHT + 1.5;
}

/**
 * Half the width of what is actually drawn — which is wider than the platform,
 * because the nodes sit out past its edges and carry labels of their own.
 * Framing on the platform alone cropped the outermost technology of every
 * station.
 */
export function stationContentHalf(station: Station): number {
  return stationHalf(station) * NODE_SPREAD + NODE_SIZE / 2 + 1;
}

/**
 * How far back the camera has to stand to hold the whole thing in frame.
 *
 * Computed rather than eyeballed: a station gains a tier or a technology and
 * the camera steps back on its own. The assumed aspect ratio is deliberately
 * narrower than widescreen, so the framing survives a window that is not
 * 16:9 — anything narrower still is handled by the camera opening up.
 */
export function framingDistance(
  station: Station,
  fovDegrees = 42,
  aspect = 1.45
): number {
  const halfFov = (fovDegrees * Math.PI) / 180 / 2;
  // The extra height is the top tier's nodes and their labels standing proud
  // of the deck.
  const verticalReach =
    (stationHeight(station) + NODE_SIZE * 2) / 2 / Math.tan(halfFov);
  const horizontalReach =
    stationContentHalf(station) / (Math.tan(halfFov) * aspect);
  // A fifth again, so the system has air around it instead of touching the
  // edges of the frame.
  return Math.max(verticalReach, horizontalReach) * 1.2;
}
