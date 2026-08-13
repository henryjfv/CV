/**
 * How much room the city actually takes, measured rather than guessed.
 *
 * Everything that has to be *bigger than the city* — the ground plane, the
 * drafting grid set out over it — used to carry a hand-written number, and each
 * of those numbers was right only until a building moved. The last time a
 * district changed lanes, the ground stopped 30 units short of the closing
 * tower and the final shot of the whole career was framed against a hole.
 *
 * So the extents are a `Box3` over the stations, at their real footprints and
 * real crowns. Move a building, add a role, widen a lane: the ground and the
 * grid follow on their own.
 */

import * as THREE from "three";
import { stations } from "@/data/world";
import { stationContentHalf, stationCrown } from "./metrics";

/** The atrium and the corridor stand in front of the city, at positive z. */
const APPROACH_Z = 26;

export const cityBox = (() => {
  const box = new THREE.Box3();
  box.makeEmpty();

  for (const station of stations) {
    const half = stationContentHalf(station);
    const { x, z } = station.position;
    box.expandByPoint(new THREE.Vector3(x - half, 0, z - half));
    box.expandByPoint(
      new THREE.Vector3(x + half, stationCrown(station), z + half)
    );
  }

  // The world does not begin at the first building: the visitor walks out of an
  // atrium to reach it, and the ground has to be under them the whole way.
  box.expandByPoint(new THREE.Vector3(0, 0, APPROACH_Z));
  return box;
})();

const size = cityBox.getSize(new THREE.Vector3());
const centre = cityBox.getCenter(new THREE.Vector3());

/** Middle of the city on the ground plane. */
export const CITY_CENTRE_X = centre.x;
export const CITY_CENTRE_Z = centre.z;

export const CITY_HALF_WIDTH = size.x / 2;
export const CITY_HALF_DEPTH = size.z / 2;

/** The far edge of the plan — past the last building, not at it. */
export const CITY_FAR_Z = cityBox.min.z;
export const CITY_NEAR_Z = cityBox.max.z;

/**
 * How far past the city anything underneath it should reach.
 *
 * Generous on purpose: at this fog density the ground has to run well past the
 * furthest thing that can be seen, or the horizon is a straight edge with dusk
 * on the far side of it.
 */
export const GROUND_MARGIN = 150;
