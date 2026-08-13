import { hasAntenna, scopeHeight, specFor, tenureHalf } from "@/data/city";
import type { LayerId, Station, StationLayer } from "@/data/world";

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

/**
 * The floors of a building, bottom to top — the reverse of how a diagram is
 * read on paper. Data is at the bottom because it is the foundation.
 *
 * This lives here rather than in the component that draws it because three
 * things now depend on agreeing about it: the geometry, the camera that climbs
 * it, and the panel that lists the floors. They disagreed once, and the result
 * was a camera that flew to the interface tier while the panel highlighted the
 * data one.
 */
export const WORLD_ORDER: LayerId[] = ["data", "service", "interface", "ai"];

/** A station's tiers in the order they are climbed. */
export function worldTiers(station: Station): StationLayer[] {
  return WORLD_ORDER.map((id) =>
    station.layers.find((layer) => layer.id === id)
  ).filter((layer): layer is StationLayer => Boolean(layer));
}

/** Height of floor `index`, counting from the ground floor. */
export function tierY(index: number): number {
  return 1.4 + index * LAYER_HEIGHT;
}

/** Edge length of a technology node. */
export const NODE_SIZE = 1.5;

/**
 * How far a tier's nodes spread from the centre, as a share of the half-width.
 *
 * Tight enough that every node stands *inside* the building. The tiers used to
 * be open platforms, so nodes could hang off the edges; now that there are
 * columns and a roof around them, anything past the façade reads as broken.
 */
export const NODE_SPREAD = 0.72;

/** The floor slabs' footprint, as a share of the platform they stand on. */
export const BUILDING_WIDTH = 1.9;
export const BUILDING_DEPTH = 1.25;

/**
 * The façade's own footprint, as a share of the platform. Wider than the slabs
 * inside it, because the shell has to enclose them — and deeper than it is wide
 * would read as a wall from the avenue, so the depth is held under the width.
 */
export const FACADE_WIDTH = 2;
export const FACADE_DEPTH = 1.55;

export function stationHalf(station: Station): number {
  return tenureHalf(specFor(station.id));
}

/**
 * Total height, from platform to roof.
 *
 * Scope sets it — see the note in `city.ts` about why height is not months —
 * but the floors of the system have to fit inside regardless, and the number of
 * tiers is a fact of the geometry rather than of the data. So the scope figure
 * is a floor, not the whole answer: a small role with four tiers still gets a
 * building tall enough to stand them in.
 */
export function stationHeight(station: Station): number {
  const stacked = station.layers.length * LAYER_HEIGHT + 1.5;
  return Math.max(stacked, scopeHeight(specFor(station.id)));
}

/**
 * Half the width of what is actually drawn. The platform is now the widest
 * thing at a station — the building sits within it and the nodes within that —
 * so this is the platform plus air.
 */
/**
 * The top of everything the building carries, mast included.
 *
 * The framing below is computed from this rather than from the roof, because a
 * mast adds a third again to the tallest building in the city — and the tower
 * that closes the career was the one being decapitated by its own viewpoint.
 */
export function stationCrown(station: Station): number {
  const spec = specFor(station.id);
  const height = stationHeight(station);
  // Matches the mast in `massing.ts`, plus a little for the rooftop plant.
  return hasAntenna(spec) ? height * 1.28 + 0.5 : height + 1.4;
}

export function stationContentHalf(station: Station): number {
  // The widest thing is not the building but the perimeter drawn around it,
  // where a station has one.
  return stationHalf(station) * 1.15 + 1.5;
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
    (stationCrown(station) + NODE_SIZE * 2) / 2 / Math.tan(halfFov);
  const horizontalReach =
    stationContentHalf(station) / (Math.tan(halfFov) * aspect);
  // A third again, so the building has air around it instead of filling the
  // frame edge to edge.
  return Math.max(verticalReach, horizontalReach) * 1.35;
}
