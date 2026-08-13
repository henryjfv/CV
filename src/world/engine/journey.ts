/**
 * Where the visitor is along the rail, kept deliberately outside React.
 *
 * The value changes every frame; putting it in component state would rerender
 * the tree sixty times a second. Instead the scene reads the mutable object
 * directly in its frame loop, and React only hears about the coarse things it
 * actually renders — the active zone, the selected station, and whether the
 * visitor has moved at all.
 */

import { stations } from "@/data/world";
import { stationRail, THRESHOLD } from "./rail";

/**
 * The three scales the city is read at.
 *
 * `city` is the walk down the avenue; `district` is standing at a building with
 * the freedom to look around it; `building` is inside one, going up it floor by
 * floor. They are one axis, not three modes: the visitor only ever moves in or
 * out along it.
 */
export type Level = "city" | "district" | "building";

export type JourneySnapshot = {
  /** Coarse position along the rail, used by the HUD to highlight the nav. */
  zoneId: string;
  /** Station whose panel is open, if any. */
  selectedId: string | null;
  /** True once the visitor has moved at all, which retires the hints. */
  hasMoved: boolean;
  level: Level;
  /** Floor of the entered building, 0 at the bottom tier. */
  floor: number;
};

type Listener = (snapshot: JourneySnapshot) => void;

const listeners = new Set<Listener>();

export const journey = {
  /** Where the camera is easing towards, 0–1. */
  target: 0,
  /** Where the camera actually is. Eased towards `target` each frame. */
  progress: 0,
  /**
   * How far inside the entered building the camera is, 0–1. Driven by time
   * rather than by a spring, so entering always takes the same 1.2 seconds
   * whatever the frame rate — a cut would throw away the one moment where the
   * façade turning to glass is legible.
   */
  entry: 0,
  /** Free look around the building being stood at, in radians. */
  orbit: 0,
  orbitTarget: 0,
};

/** How long the camera takes to move in or out of a building, in seconds. */
const ENTRY_SECONDS = 1.2;
/** How far round a building the visitor may swing while stopped at it. */
export const ORBIT_LIMIT = 0.85;

/** The easing every camera move in this world uses. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

let snapshot: JourneySnapshot = {
  zoneId: "entrance",
  selectedId: null,
  hasMoved: false,
  level: "city",
  floor: 0,
};

export function getSnapshot(): JourneySnapshot {
  return snapshot;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(next: JourneySnapshot) {
  if (
    next.zoneId === snapshot.zoneId &&
    next.selectedId === snapshot.selectedId &&
    next.hasMoved === snapshot.hasMoved &&
    next.level === snapshot.level &&
    next.floor === snapshot.floor
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

/**
 * Which zone a rail position belongs to. A station claims the rail from
 * halfway back to the one before it, so the nav highlights whichever station
 * the visitor is actually among.
 */
function zoneAt(t: number): string {
  if (t < THRESHOLD) return "entrance";

  let current = "site";
  let previous = THRESHOLD;
  for (const station of stations) {
    const at = stationRail[station.id];
    if (t >= (previous + at) / 2) current = station.id;
    previous = at;
  }
  return current;
}

/**
 * Whether the rail has actually arrived somewhere.
 *
 * Standing at a station is what unlocks looking around it, so the tolerance is
 * tight: drifting past a building at speed is the city scale, not the district
 * one.
 */
function levelAt(t: number): Level {
  const arrived = stations.some(
    (station) => Math.abs(stationRail[station.id] - t) < 0.015
  );
  return arrived ? "district" : "city";
}

export function advance(delta: number) {
  setTarget(journey.target + delta);
}

export function setTarget(value: number) {
  const previous = journey.target;
  journey.target = clamp01(value);
  // Moving on abandons whatever was being looked at: an orbit held across a
  // journey down the avenue leaves the camera facing sideways at the next
  // building for no reason the visitor can trace.
  if (Math.abs(journey.target - previous) > 0.004) journey.orbitTarget = 0;

  publish({
    ...snapshot,
    zoneId: zoneAt(journey.target),
    hasMoved: snapshot.hasMoved || journey.target > 0.002,
    level: snapshot.level === "building" ? "building" : levelAt(journey.target),
  });
}

/** Cinematic jump used by the secondary navigation. */
export function goToStation(id: string) {
  const at = stationRail[id];
  if (at === undefined) return;
  setTarget(at);
  publish({ ...snapshot, zoneId: zoneAt(at), selectedId: id, hasMoved: true });
}

/** Steps to the next or previous station from wherever the visitor is now. */
export function goToAdjacentStation(direction: 1 | -1) {
  const positions = stations.map((station) => stationRail[station.id]);
  const current = journey.target;

  const next =
    direction === 1
      ? positions.find((at) => at > current + 0.01)
      : [...positions].reverse().find((at) => at < current - 0.01);

  if (next !== undefined) {
    setTarget(next);
    return;
  }
  // Past the last station going forwards, or before the first going back:
  // the ends of the rail are the atrium and the closing view.
  setTarget(direction === 1 ? 1 : 0);
}

export function selectStation(id: string | null) {
  publish({ ...snapshot, selectedId: id });
}

/**
 * Goes inside a building. The rail is sent to that station first, so leaving
 * again puts the visitor back on the avenue where they were standing rather
 * than wherever they happened to have scrolled to.
 */
export function enterBuilding(id: string) {
  const at = stationRail[id];
  if (at === undefined) return;
  journey.target = at;
  journey.orbitTarget = 0;
  publish({
    ...snapshot,
    zoneId: zoneAt(at),
    selectedId: id,
    hasMoved: true,
    level: "building",
    floor: 0,
  });
}

export function exitBuilding() {
  publish({
    ...snapshot,
    selectedId: null,
    level: levelAt(journey.target),
    floor: 0,
  });
}

/** Moves up or down the floors of the building being stood in. */
export function stepFloor(delta: number, floors: number) {
  if (snapshot.level !== "building") return;
  const floor = Math.max(0, Math.min(floors - 1, snapshot.floor + delta));
  if (floor === snapshot.floor) return;
  publish({ ...snapshot, floor });
}

export function goToFloor(floor: number) {
  if (snapshot.level !== "building") return;
  publish({ ...snapshot, floor });
}

/** Swings the view around the building being stood at. */
export function orbitBy(delta: number) {
  if (snapshot.level === "city") return;
  journey.orbitTarget = Math.max(
    -ORBIT_LIMIT,
    Math.min(ORBIT_LIMIT, journey.orbitTarget + delta)
  );
}

/** Eases `progress`, `entry` and `orbit` towards their targets. */
export function tick(dt: number, reducedMotion: boolean) {
  const distance = Math.abs(journey.target - journey.progress);
  // A long jump gets a slower spring, so crossing the world reads as a travelling
  // shot rather than a cut. Short scroll nudges stay responsive.
  const damping = reducedMotion ? 6 : distance > 0.12 ? 1.7 : 3.2;
  const factor = 1 - Math.exp(-damping * dt);
  journey.progress += (journey.target - journey.progress) * factor;

  const wants = snapshot.level === "building" ? 1 : 0;
  if (reducedMotion) {
    // Asked for less motion: the walls turn to glass and the camera is simply
    // already inside. No travelling shot to sit through.
    journey.entry = wants;
    journey.orbit = journey.orbitTarget;
    return;
  }

  const step = dt / ENTRY_SECONDS;
  journey.entry =
    wants > journey.entry
      ? Math.min(1, journey.entry + step)
      : Math.max(0, journey.entry - step);
  journey.orbit += (journey.orbitTarget - journey.orbit) * factor;
}

export function resetJourney() {
  journey.target = 0;
  journey.progress = 0;
  journey.entry = 0;
  journey.orbit = 0;
  journey.orbitTarget = 0;
  snapshot = {
    zoneId: "entrance",
    selectedId: null,
    hasMoved: false,
    level: "city",
    floor: 0,
  };
  listeners.forEach((listener) => listener(snapshot));
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
