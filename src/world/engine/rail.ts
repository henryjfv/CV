import * as THREE from "three";
import { stations } from "@/data/world";
import { framingDistance, stationHalf, stationHeight } from "./metrics";

/**
 * The line the camera rides, and the line it looks along.
 *
 * Both are generated from where the stations actually stand, as one list of
 * waypoints — each with an eye position and the point it looks at. Typing
 * control points by hand is how the first version of this rail finished inside
 * the last building.
 *
 * The two curves are sampled with `getPoint`, not `getPointAt`. `getPointAt`
 * walks by arc length, and because the eye path and the gaze path are different
 * lengths, the same `t` landed on different waypoints in each: the camera
 * arrived in front of a station while still looking somewhere between the last
 * two. `getPoint` maps `t` uniformly across control points, so waypoint *i* on
 * one curve is always waypoint *i* on the other — and a station's position on
 * the rail becomes its index, exactly, with nothing to measure.
 */

type Waypoint = {
  eye: THREE.Vector3;
  focus: THREE.Vector3;
};

/** The atrium and the corridor, which exist independently of the stations. */
const APPROACH: Waypoint[] = [
  {
    eye: new THREE.Vector3(0, 1.65, 24),
    focus: new THREE.Vector3(0, 3.4, -2),
  },
  {
    // The threshold, at the base of the wall carrying the name.
    eye: new THREE.Vector3(0, 1.65, 1.2),
    focus: new THREE.Vector3(0, 2.8, -10),
  },
  {
    eye: new THREE.Vector3(0, 1.9, -7),
    focus: new THREE.Vector3(0, 2.4, -20),
  },
  {
    eye: new THREE.Vector3(0, 3.2, -24),
    focus: new THREE.Vector3(0, 2.6, -40),
  },
];

/**
 * Where the camera stands to look at a station.
 *
 * Not beside it: an architecture seen edge-on from four metres away is a wall.
 * The viewpoint sits back along a diagonal — partly out towards the avenue,
 * partly in front — at the distance that holds the whole system in frame. That
 * distance is computed from the station's own size, so a role that gains a tier
 * pushes its own viewpoint back.
 */
const DIAGONAL = Math.SQRT1_2;

function viewpointFor(station: (typeof stations)[number]): Waypoint {
  const distance = framingDistance(station);
  const towardsAvenue = station.position.x === 0 ? 0 : Math.sign(-station.position.x);
  const lateral = towardsAvenue === 0 ? 0 : DIAGONAL * distance;
  const depth = towardsAvenue === 0 ? distance : DIAGONAL * distance;

  return {
    eye: new THREE.Vector3(
      station.position.x + towardsAvenue * lateral,
      Math.max(4.5, stationHeight(station) * 0.5),
      station.position.z + depth
    ),
    focus: new THREE.Vector3(
      station.position.x,
      stationHeight(station) * 0.45,
      station.position.z
    ),
  };
}

const waypoints: Waypoint[] = [...APPROACH, ...stations.map(viewpointFor)];

export const railPath = new THREE.CatmullRomCurve3(
  waypoints.map((waypoint) => waypoint.eye)
);

export const railGaze = new THREE.CatmullRomCurve3(
  waypoints.map((waypoint) => waypoint.focus)
);

/** Rail position of waypoint `index`, under `getPoint`'s uniform mapping. */
function railAt(index: number): number {
  return index / (waypoints.length - 1);
}

/** Rail position at which the visitor passes through the wall and leaves the atrium. */
export const THRESHOLD = railAt(1);

/**
 * Where each station sits on the rail — its own waypoint, so the secondary
 * navigation lands exactly where the walk would have stopped.
 */
export const stationRail: Record<string, number> = Object.fromEntries(
  stations.map((station, index) => [station.id, railAt(APPROACH.length + index)])
);

/**
 * The rail must never pass through a station.
 *
 * This has gone wrong twice — once ending the journey inside the closing
 * building, once parking the final shot on top of the station before it — and
 * both times it was invisible until someone looked at a screenshot. Stations
 * move and grow as the CV changes, so the invariant is checked here, next to
 * the thing that can break it. Stripped from production builds.
 */
if (process.env.NODE_ENV !== "production") {
  const probe = new THREE.Vector3();
  const collisions = new Set<string>();
  for (let i = 0; i <= 300; i += 1) {
    railPath.getPoint(i / 300, probe);
    for (const station of stations) {
      const half = stationHalf(station);
      if (
        Math.abs(probe.z - station.position.z) < half &&
        Math.abs(probe.x - station.position.x) < half
      ) {
        collisions.add(station.id);
      }
    }
  }
  if (collisions.size > 0) {
    console.error(
      `[world] the camera rail passes through: ${[...collisions].join(", ")}. ` +
        `Move the station or widen the spacing in world.ts.`
    );
  }
}
