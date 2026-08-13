import * as THREE from "three";
import { stations, type Station } from "@/data/world";
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

/**
 * A point on the empty avenue, between two stations.
 *
 * Without these the rail ran viewpoint to viewpoint, and a viewpoint sits out
 * on the avenue side of its own station. Two stations in opposite lanes then
 * gave the camera a diagonal that cut the corner off whichever block lay
 * between them — first Opensols, then BYONDIT. Moving buildings fixed one
 * crossing and created the next.
 *
 * Returning to the centre line between stations fixes the class of problem
 * instead of its instances: every viewpoint faces the avenue, so a leg that
 * starts on the avenue has nothing standing in it. It also happens to be how
 * the walk should read — down the middle, turning to look.
 */
function avenueBetween(
  previous: Station,
  next: Station,
  from: Waypoint,
  to: Waypoint
): Waypoint {
  /**
   * Halfway between the two *viewpoints*, not between the two buildings.
   *
   * Between the buildings looks like the obvious answer and is wrong. A tall
   * station stands its viewpoint a long way back — the closing tower's is 56
   * units out, at z −244, while the midpoint between it and the station before
   * it is z −267. A waypoint there sends the camera past the building and back,
   * and a Catmull-Rom through a reversal overshoots further still: the final
   * shot of the career ended up at half its intended distance with the tower's
   * top and mast out of frame. It read as a framing bug and it was a routing
   * one.
   *
   * Clamping the midpoint into range was the first fix and it was worse: it
   * left a six-unit final segment carrying a thirty-unit tangent, which is a
   * curve that leaves the rail entirely. Interpolating the viewpoints keeps
   * every segment about as long as its neighbours, which is the property a
   * Catmull-Rom actually needs.
   */
  const z = (from.eye.z + to.eye.z) / 2;

  return {
    eye: new THREE.Vector3(0, Math.max(7, (from.eye.y + to.eye.y) / 2), z),
    // Already turning towards what is coming, so the arrival is not a snap.
    focus: new THREE.Vector3(
      next.position.x * 0.5,
      stationHeight(next) * 0.45,
      next.position.z
    ),
  };
}

const railIndex: Record<string, number> = {};
const journeyWaypoints: Waypoint[] = [];
const viewpoints = stations.map(viewpointFor);

stations.forEach((station, index) => {
  if (index > 0) {
    journeyWaypoints.push(
      avenueBetween(
        stations[index - 1],
        station,
        viewpoints[index - 1],
        viewpoints[index]
      )
    );
  }
  railIndex[station.id] = APPROACH.length + journeyWaypoints.length;
  journeyWaypoints.push(viewpoints[index]);
});

const waypoints: Waypoint[] = [...APPROACH, ...journeyWaypoints];

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
  Object.entries(railIndex).map(([id, index]) => [id, railAt(index)])
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
